import type { Hooks, PluginInput } from "@miaopan/plugin"
import { OAUTH_DUMMY_KEY } from "../auth"
import { InstallationVersion } from "@miaopan-code/core/installation/version"
import { OauthCallbackPage } from "@miaopan-code/core/oauth/page"
import { createServer } from "http"
import open from "open"
import { t, type Language } from "@miaopan-code/core/i18n"
import { pluginLanguage } from "./language"

const OAUTH_CLIENT_ID = "LOCAL_APPLICATION"
const OAUTH_CALLBACK_HOST = "127.0.0.1"
const OAUTH_CALLBACK_PATH = "/"
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000
const ACCESS_TOKEN_REFRESH_SKEW_MS = 120_000

interface PkceCodes {
  verifier: string
  challenge: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

interface PendingOAuth {
  account: string
  state: string
  pkce: PkceCodes
  resolve: (tokens: TokenResponse) => void
  reject: (error: Error) => void
  language: Language
}

let oauthServer: ReturnType<typeof createServer> | undefined
let pendingOAuth: PendingOAuth | undefined
let oauthServerPort: number | undefined
let oauthLanguage: Language = "zh-CN"

function normalizeAccount(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\.snowflakecomputing\.com\/?$/, "")
    .replace(/\/+$/, "")
}

function generateRandomString(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join("")
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function generatePKCE(): Promise<PkceCodes> {
  const verifier = generateRandomString(64)
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return {
    verifier,
    challenge: base64UrlEncode(hash),
  }
}

function callbackUrl(language?: Language) {
  if (!oauthServerPort) throw new Error(t(language, "error.oauth_server_not_running"))
  return `http://${OAUTH_CALLBACK_HOST}:${oauthServerPort}${OAUTH_CALLBACK_PATH}`
}

export function oauthScope(role: string | undefined) {
  if (!role) return "refresh_token"
  return /^[-_A-Za-z0-9]+$/.test(role)
    ? `refresh_token session:role:${role}`
    : `refresh_token session:role-encoded:${encodeURIComponent(role)}`
}

function authHeaders() {
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "User-Agent": `miaopan-code/${InstallationVersion}`,
  }
}

function authBasicHeader() {
  return `Basic ${Buffer.from(`${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_ID}`).toString("base64")}`
}

function buildAuthorizeUrl(
  account: string,
  role: string | undefined,
  state: string,
  pkce: PkceCodes,
  language: Language,
) {
  const scope = oauthScope(role)
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    response_type: "code",
    redirect_uri: callbackUrl(language),
    scope,
    state,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
  })
  return `https://${account}.snowflakecomputing.com/oauth/authorize?${params.toString()}`
}

async function exchangeCodeForToken(account: string, code: string, pkce: PkceCodes, language: Language) {
  const response = await fetch(`https://${account}.snowflakecomputing.com/oauth/token-request`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      Authorization: authBasicHeader(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(language),
      client_id: OAUTH_CLIENT_ID,
      code_verifier: pkce.verifier,
    }).toString(),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      t(language, "error.oauth_exchange_failed", {
        provider: "Snowflake",
        status: response.status,
        detail: detail ? `: ${detail}` : "",
      }),
    )
  }

  const token = (await response.json()) as TokenResponse
  if (!token.access_token) throw new Error(t(language, "error.snowflake_token_missing"))
  if (!token.refresh_token) {
    throw new Error(t(language, "error.snowflake_refresh_token_missing"))
  }
  return token
}

async function refreshAccessToken(account: string, refreshToken: string, language: Language) {
  const response = await fetch(`https://${account}.snowflakecomputing.com/oauth/token-request`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      Authorization: authBasicHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: OAUTH_CLIENT_ID,
    }).toString(),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      t(language, "error.oauth_refresh_failed", {
        provider: "Snowflake",
        status: response.status,
        detail: detail ? `: ${detail}` : "",
      }),
    )
  }

  const token = (await response.json()) as TokenResponse
  if (!token.access_token) throw new Error(t(language, "error.snowflake_refresh_missing"))
  return token
}

async function startOAuthServer(language: Language) {
  oauthLanguage = language
  if (oauthServer) return

  oauthServer = createServer((req, res) => {
    const host = req.headers.host || `${OAUTH_CALLBACK_HOST}:${oauthServerPort ?? 0}`
    const url = new URL(req.url || "/", `http://${host}`)

    if (url.pathname !== OAUTH_CALLBACK_PATH) {
      res.writeHead(404)
      res.end(t(oauthLanguage, "error.oauth_not_found"))
      return
    }

    const state = url.searchParams.get("state")
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")
    const errorDescription = url.searchParams.get("error_description")

    // CSRF guard: validate state before processing any callback
    if (!pendingOAuth || state !== pendingOAuth.state) {
      const callbackLanguage = pendingOAuth?.language ?? oauthLanguage
      const message = t(callbackLanguage, "error.oauth_state_invalid")
      pendingOAuth?.reject(new Error(message))
      pendingOAuth = undefined
      res.writeHead(400, { "Content-Type": "text/html" })
      res.end(OauthCallbackPage.error(message, { provider: "Snowflake", language: callbackLanguage }))
      return
    }

    const current = pendingOAuth
    pendingOAuth = undefined

    if (error) {
      const message = errorDescription || error
      current.reject(new Error(message))
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(OauthCallbackPage.error(message, { provider: "Snowflake", language: current.language }))
      return
    }

    if (!code) {
      const message = t(current.language, "error.oauth_code_missing")
      current.reject(new Error(message))
      res.writeHead(400, { "Content-Type": "text/html" })
      res.end(OauthCallbackPage.error(message, { provider: "Snowflake", language: current.language }))
      return
    }

    exchangeCodeForToken(current.account, code, current.pkce, current.language)
      .then((tokens) => current.resolve(tokens))
      .catch((err) => current.reject(err instanceof Error ? err : new Error(String(err))))

    res.writeHead(200, { "Content-Type": "text/html" })
    res.end(OauthCallbackPage.success({ provider: "Snowflake", language: current.language }))
  })

  await new Promise<void>((resolve, reject) => {
    oauthServer!.listen(0, OAUTH_CALLBACK_HOST, () => {
      const address = oauthServer!.address()
      if (!address || typeof address === "string") {
        reject(new Error(t(language, "error.oauth_port_unresolved")))
        return
      }
      oauthServerPort = address.port
      resolve()
    })
    oauthServer!.on("error", reject)
  })
}

function stopOAuthServer() {
  if (!oauthServer) return
  oauthServer.close()
  oauthServer = undefined
  oauthServerPort = undefined
}

function waitForOAuthCallback(
  account: string,
  pkce: PkceCodes,
  state: string,
  language: Language,
): Promise<TokenResponse> {
  if (pendingOAuth) {
    pendingOAuth.reject(new Error(t(pendingOAuth.language, "error.oauth_superseded")))
    pendingOAuth = undefined
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!pendingOAuth) return
      pendingOAuth = undefined
      stopOAuthServer()
      reject(new Error(t(language, "error.oauth_timeout")))
    }, OAUTH_TIMEOUT_MS)

    pendingOAuth = {
      account,
      state,
      pkce,
      language,
      resolve: (tokens) => {
        clearTimeout(timeout)
        resolve(tokens)
      },
      reject: (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    }
  })
}

export async function SnowflakeCortexAuthPlugin(
  _input: PluginInput,
  options?: Record<string, unknown>,
): Promise<Hooks> {
  const language = pluginLanguage(options)
  const prompts = [
    {
      type: "text" as const,
      key: "account",
      message: t(language, "plugin.snowflake.account_identifier"),
      placeholder: t(language, "plugin.example.snowflake_account"),
      validate: (value: string) => (value && value.trim().length > 0 ? undefined : t(language, "provider.required")),
    },
    {
      type: "text" as const,
      key: "role",
      message: t(language, "plugin.snowflake.role_optional"),
      placeholder: "PUBLIC",
    },
  ]

  return {
    auth: {
      provider: "snowflake-cortex",
      async loader(getAuth, _provider) {
        let auth = await getAuth()
        if (auth.type !== "oauth") return {}

        let refreshPromise:
          | Promise<{
              access: string
              refresh: string
              expires: number
            }>
          | undefined

        const oauth = auth as typeof auth & { refresh: string; access: string; expires: number; accountId?: string }

        if (oauth.accountId && oauth.refresh && oauth.expires && oauth.expires <= Date.now()) {
          try {
            const tokens = await refreshAccessToken(oauth.accountId, oauth.refresh, language)
            const refreshedRefresh = tokens.refresh_token || oauth.refresh
            const refreshedExpires = Date.now() + (tokens.expires_in ?? 600) * 1000
            await _input.client.auth
              .set({
                path: { id: "snowflake-cortex" },
                body: {
                  type: "oauth",
                  access: tokens.access_token,
                  refresh: refreshedRefresh,
                  expires: refreshedExpires,
                  ...(oauth.accountId && { accountId: oauth.accountId }),
                },
              })
              .catch(() => {})
          } catch {}
        }

        return {
          apiKey: OAUTH_DUMMY_KEY,
          async fetch(requestInput: RequestInfo | URL, init?: RequestInit) {
            let currentAuth = await getAuth()
            if (currentAuth.type !== "oauth") return fetch(requestInput, init)
            let currentOauth = currentAuth as typeof currentAuth & {
              refresh: string
              access: string
              expires: number
              accountId?: string
            }

            if (!currentOauth.accountId) throw new Error(t(language, "error.snowflake_account_required"))
            const accountId = currentOauth.accountId

            const refresh = async () => {
              if (!refreshPromise) {
                const refreshToken = currentOauth.refresh
                refreshPromise = refreshAccessToken(accountId, refreshToken, language)
                  .then(async (tokens) => {
                    const refreshedRefresh = tokens.refresh_token || refreshToken
                    const refreshedExpires = Date.now() + (tokens.expires_in ?? 600) * 1000
                    await _input.client.auth
                      .set({
                        path: { id: "snowflake-cortex" },
                        body: {
                          type: "oauth",
                          access: tokens.access_token,
                          refresh: refreshedRefresh,
                          expires: refreshedExpires,
                          ...(accountId && { accountId }),
                        },
                      })
                      .catch(() => {})
                    return {
                      access: tokens.access_token,
                      refresh: refreshedRefresh,
                      expires: refreshedExpires,
                    }
                  })
                  .finally(() => {
                    refreshPromise = undefined
                  })
              }

              const refreshed = await refreshPromise
              currentOauth = { ...currentOauth, ...refreshed }
            }

            const prepareRequest = () => {
              const headers = new Headers(requestInput instanceof Request ? requestInput.headers : undefined)
              if (init?.headers) {
                const entries =
                  init.headers instanceof Headers
                    ? init.headers.entries()
                    : Array.isArray(init.headers)
                      ? init.headers
                      : Object.entries(init.headers as Record<string, string | undefined>)
                for (const [key, value] of entries) {
                  if (value !== undefined) headers.set(key, String(value))
                }
              }
              headers.set("authorization", `Bearer ${currentOauth.access}`)
              headers.set("User-Agent", `miaopan-code/${InstallationVersion}`)

              let body = init?.body
              if (body && typeof body === "string") {
                try {
                  const parsed = JSON.parse(body)
                  if ("max_tokens" in parsed) {
                    parsed.max_completion_tokens = parsed.max_tokens
                    delete parsed.max_tokens
                    body = JSON.stringify(parsed)
                  }
                } catch {}
              }

              return { ...init, headers, body }
            }

            const transformResponse = async (response: Response) => {
              if (!response.ok && response.status === 400) {
                try {
                  const errorData = await response.clone().json()
                  const errorMessage = String(errorData.message || errorData.error || "")
                  if (errorMessage.toLowerCase().includes("conversation complete")) {
                    return new Response(
                      JSON.stringify({
                        choices: [{ finish_reason: "stop", message: { content: "", role: "assistant" } }],
                      }),
                      { status: 200, headers: new Headers({ "content-type": "application/json" }) },
                    )
                  }
                } catch {}
              }

              if (response.body && response.headers.get("content-type")?.includes("text/event-stream")) {
                const reader = response.body.getReader()
                const encoder = new TextEncoder()
                const decoder = new TextDecoder()
                const stream = new ReadableStream({
                  async pull(ctrl) {
                    const { done, value } = await reader.read()
                    if (done) {
                      ctrl.close()
                      return
                    }
                    const text = decoder.decode(value, { stream: true })
                    ctrl.enqueue(encoder.encode(text.replace(/"role"\s*:\s*""/g, '"role":"assistant"')))
                  },
                  cancel() {
                    reader.cancel()
                  },
                })
                return new Response(stream, { headers: response.headers, status: response.status })
              }

              return response
            }

            const expiresSoon =
              !currentOauth.expires ||
              !currentOauth.access ||
              currentOauth.expires - Date.now() <= ACCESS_TOKEN_REFRESH_SKEW_MS

            if (expiresSoon) await refresh()

            const response = await fetch(requestInput, prepareRequest())

            if (response.status === 401) {
              await refresh()
              return transformResponse(await fetch(requestInput, prepareRequest()))
            }

            return transformResponse(response)
          },
        }
      },
      methods: [
        {
          type: "oauth",
          label: t(language, "plugin.snowflake.login_browser"),
          prompts,
          async authorize(inputs = {}) {
            const account = normalizeAccount(inputs.account || "")
            if (!account) throw new Error(t(language, "error.snowflake_account_required"))

            await startOAuthServer(language)
            const pkce = await generatePKCE()
            const state = generateRandomString(64)
            const role = (inputs.role || "").trim() || undefined
            const url = buildAuthorizeUrl(account, role, state, pkce, language)
            const callbackPromise = waitForOAuthCallback(account, pkce, state, language)
            await open(url).catch(() => undefined)

            return {
              url,
              instructions: t(language, "plugin.snowflake.browser_instructions"),
              method: "auto" as const,
              async callback() {
                try {
                  const tokens = await callbackPromise
                  return {
                    type: "success" as const,
                    refresh: tokens.refresh_token!,
                    access: tokens.access_token,
                    expires: Date.now() + (tokens.expires_in ?? 600) * 1000,
                    accountId: account,
                  }
                } catch {
                  return { type: "failed" as const }
                } finally {
                  stopOAuthServer()
                }
              },
            }
          },
        },
        {
          type: "api",
          label: t(language, "plugin.snowflake.paste_token"),
          prompts: prompts.filter((item) => item.key === "account"),
        },
      ],
    },
  }
}
