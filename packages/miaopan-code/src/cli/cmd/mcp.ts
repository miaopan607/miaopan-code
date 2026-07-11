import { cmd } from "./cmd"
import { ConfigV1 } from "@miaopan-code/core/v1/config/config"
import { effectCmd } from "../effect-cmd"
import { Cause } from "effect"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js"
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js"
import * as prompts from "@clack/prompts"
import { UI } from "../ui"
import { MCP } from "../../mcp"
import { McpAuth } from "../../mcp/auth"
import { McpOAuthProvider } from "../../mcp/oauth-provider"
import { Config } from "@/config/config"
import { ConfigMCPV1 } from "@miaopan-code/core/v1/config/mcp"
import { InstanceRef } from "@/effect/instance-ref"
import { InstallationVersion } from "@miaopan-code/core/installation/version"
import path from "path"
import { Global } from "@miaopan-code/core/global"
import { modify, applyEdits } from "jsonc-parser"
import { Filesystem } from "@/util/filesystem"
import { Effect } from "effect"

function getAuthStatusIcon(status: MCP.AuthStatus): string {
  switch (status) {
    case "authenticated":
      return "✓"
    case "expired":
      return "⚠"
    case "not_authenticated":
      return "✗"
  }
}

function getAuthStatusText(status: MCP.AuthStatus): string {
  switch (status) {
    case "authenticated":
      return UI.t("mcp.status_authenticated")
    case "expired":
      return UI.t("mcp.status_expired")
    case "not_authenticated":
      return UI.t("mcp.status_not_authenticated")
  }
}

type McpEntry = NonNullable<ConfigV1.Info["mcp"]>[string]

type McpConfigured = ConfigMCPV1.Info
function isMcpConfigured(config: McpEntry): config is McpConfigured {
  return typeof config === "object" && config !== null && "type" in config
}

type McpRemote = Extract<McpConfigured, { type: "remote" }>
function isMcpRemote(config: McpEntry): config is McpRemote {
  return isMcpConfigured(config) && config.type === "remote"
}

function configuredServers(config: ConfigV1.Info) {
  return Object.entries(config.mcp ?? {}).filter((entry): entry is [string, McpConfigured] => isMcpConfigured(entry[1]))
}

function oauthServers(config: ConfigV1.Info) {
  return configuredServers(config).filter(
    (entry): entry is [string, McpRemote] => isMcpRemote(entry[1]) && entry[1].oauth !== false,
  )
}

function listState() {
  return Effect.gen(function* () {
    const cfg = yield* Config.Service
    const mcp = yield* MCP.Service
    const config = yield* cfg.get()
    const statuses = yield* mcp.status()
    const stored = yield* Effect.all(
      Object.fromEntries(configuredServers(config).map(([name]) => [name, mcp.hasStoredTokens(name)])),
      { concurrency: "unbounded" },
    )
    return { config, statuses, stored }
  })
}

function authState() {
  return Effect.gen(function* () {
    const cfg = yield* Config.Service
    const mcp = yield* MCP.Service
    const config = yield* cfg.get()
    const auth = yield* Effect.all(
      Object.fromEntries(oauthServers(config).map(([name]) => [name, mcp.getAuthStatus(name)])),
      { concurrency: "unbounded" },
    )
    return { config, auth }
  })
}

export const McpCommand = cmd({
  command: "mcp",
  describe: UI.t("cli.mcp_manage"),
  builder: (yargs) =>
    yargs
      .command(McpAddCommand)
      .command(McpListCommand)
      .command(McpAuthCommand)
      .command(McpLogoutCommand)
      .command(McpDebugCommand)
      .demandCommand(),
  async handler() {},
})

export const McpListCommand = effectCmd({
  command: "list",
  aliases: ["ls"],
  describe: UI.t("cli.mcp_list"),
  handler: Effect.fn("Cli.mcp.list")(function* () {
    UI.empty()
    prompts.intro(UI.t("mcp.servers"))

    const { config, statuses, stored } = yield* listState()
    const servers = configuredServers(config)

    if (servers.length === 0) {
      prompts.log.warn(UI.t("mcp.no_servers"))
      prompts.outro(UI.t("mcp.add_hint"))
      return
    }

    for (const [name, serverConfig] of servers) {
      const status = statuses[name]
      const hasOAuth = isMcpRemote(serverConfig) && !!serverConfig.oauth
      const hasStoredTokens = stored[name]

      let statusIcon: string
      let statusText: string
      let hint = ""

      if (!status) {
        statusIcon = "○"
        statusText = UI.t("mcp.status_not_initialized")
      } else if (status.status === "connected") {
        statusIcon = "✓"
        statusText = UI.t("mcp.status_connected")
        if (hasOAuth && hasStoredTokens) {
          hint = UI.t("mcp.oauth_hint")
        }
      } else if (status.status === "disabled") {
        statusIcon = "○"
        statusText = UI.t("mcp.status_disabled")
      } else if (status.status === "needs_auth") {
        statusIcon = "⚠"
        statusText = UI.t("mcp.status_needs_auth")
      } else if (status.status === "needs_client_registration") {
        statusIcon = "✗"
        statusText = UI.t("mcp.status_needs_client")
        hint = "\n    " + status.error
      } else {
        statusIcon = "✗"
        statusText = UI.t("mcp.status_failed")
        hint = "\n    " + status.error
      }

      const typeHint = serverConfig.type === "remote" ? serverConfig.url : serverConfig.command.join(" ")
      prompts.log.info(
        `${statusIcon} ${name} ${UI.Style.TEXT_DIM}${statusText}${hint}\n    ${UI.Style.TEXT_DIM}${typeHint}`,
      )
    }

    prompts.outro(UI.t("mcp.server_count", { count: servers.length }))
  }),
})

export const McpAuthCommand = effectCmd({
  command: "auth [name]",
  describe: UI.t("cli.mcp_auth"),
  builder: (yargs) =>
    yargs
      .positional("name", {
        describe: UI.t("cli.mcp_name"),
        type: "string",
      })
      .command(McpAuthListCommand),
  handler: Effect.fn("Cli.mcp.auth")(function* (args) {
    UI.empty()
    prompts.intro(UI.t("mcp.oauth_authentication"))

    const { config, auth } = yield* authState()
    const mcpServers = config.mcp ?? {}
    const servers = oauthServers(config)

    if (servers.length === 0) {
      prompts.log.warn(UI.t("mcp.no_oauth_servers"))
      prompts.log.info(UI.t("mcp.oauth_remote_hint"))
      prompts.log.info(`
  "mcp": {
    "my-server": {
      "type": "remote",
      "url": "https://example.com/mcp"
    }
  }`)
      prompts.outro(UI.t("mcp.done"))
      return
    }

    let serverName = args.name
    if (!serverName) {
      // Build options with auth status
      const options = servers.map(([name, cfg]) => {
        const authStatus = auth[name]
        const icon = getAuthStatusIcon(authStatus)
        const statusText = getAuthStatusText(authStatus)
        const url = cfg.url
        return {
          label: `${icon} ${name} (${statusText})`,
          value: name,
          hint: url,
        }
      })

      const selected = yield* Effect.promise(() =>
        prompts.select({
          message: UI.t("mcp.select_auth_server"),
          options,
        }),
      )
      if (prompts.isCancel(selected)) throw new UI.CancelledError()
      serverName = selected
    }

    const serverConfig = mcpServers[serverName]
    if (!serverConfig) {
      prompts.log.error(UI.t("mcp.server_not_found", { name: serverName }))
      prompts.outro(UI.t("mcp.done"))
      return
    }

    if (!isMcpRemote(serverConfig) || serverConfig.oauth === false) {
      prompts.log.error(UI.t("mcp.not_oauth_remote", { name: serverName }))
      prompts.outro(UI.t("mcp.done"))
      return
    }

    // Check if already authenticated
    const authStatus = auth[serverName] ?? (yield* MCP.Service.use((mcp) => mcp.getAuthStatus(serverName)))
    if (authStatus === "authenticated") {
      const confirm = yield* Effect.promise(() =>
        prompts.confirm({
          message: UI.t("mcp.reauthenticate", { name: serverName }),
        }),
      )
      if (prompts.isCancel(confirm) || !confirm) {
        prompts.outro(UI.t("mcp.cancelled"))
        return
      }
    } else if (authStatus === "expired") {
      prompts.log.warn(UI.t("mcp.reauth_expired", { name: serverName }))
    }

    const spinner = prompts.spinner()
    spinner.start(UI.t("mcp.oauth_start"))

    yield* MCP.Service.use((mcp) =>
      mcp.authenticate(serverName, (url) => {
        spinner.stop(UI.t("mcp.authorize_browser"))
        prompts.log.info(url)
        spinner.start(UI.t("mcp.wait_authorization"))
      }),
    ).pipe(
      Effect.tap((status) =>
        Effect.sync(() => {
          if (status.status === "connected") {
            spinner.stop(UI.t("mcp.auth_success"))
          } else if (status.status === "needs_client_registration") {
            spinner.stop(UI.t("mcp.auth_failed"), 1)
            prompts.log.error(status.error)
            prompts.log.info(UI.t("mcp.add_client_id_hint"))
            prompts.log.info(`
  "mcp": {
    "${serverName}": {
      "type": "remote",
      "url": "${serverConfig.url}",
      "oauth": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret"
      }
    }
  }`)
          } else if (status.status === "failed") {
            spinner.stop(UI.t("mcp.auth_failed"), 1)
            prompts.log.error(status.error)
          } else {
            spinner.stop(UI.t("mcp.unexpected_status", { status: status.status }), 1)
          }
        }),
      ),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          spinner.stop(UI.t("mcp.auth_failed"), 1)
          const error = Cause.squash(cause)
          prompts.log.error(error instanceof Error ? error.message : String(error))
        }),
      ),
    )

    prompts.outro(UI.t("mcp.done"))
  }),
})

export const McpAuthListCommand = effectCmd({
  command: "list",
  aliases: ["ls"],
  describe: UI.t("cli.mcp_auth_list"),
  handler: Effect.fn("Cli.mcp.auth.list")(function* () {
    UI.empty()
    prompts.intro(UI.t("mcp.auth_status"))

    const { config, auth } = yield* authState()
    const servers = oauthServers(config)

    if (servers.length === 0) {
      prompts.log.warn(UI.t("mcp.no_oauth_servers"))
      prompts.outro(UI.t("mcp.done"))
      return
    }

    for (const [name, serverConfig] of servers) {
      const authStatus = auth[name]
      const icon = getAuthStatusIcon(authStatus)
      const statusText = getAuthStatusText(authStatus)
      const url = serverConfig.url

      prompts.log.info(`${icon} ${name} ${UI.Style.TEXT_DIM}${statusText}\n    ${UI.Style.TEXT_DIM}${url}`)
    }

    prompts.outro(UI.t("mcp.oauth_server_count", { count: servers.length }))
  }),
})

export const McpLogoutCommand = effectCmd({
  command: "logout [name]",
  describe: UI.t("cli.mcp_auth_remove"),
  builder: (yargs) =>
    yargs.positional("name", {
      describe: UI.t("cli.mcp_name"),
      type: "string",
    }),
  handler: Effect.fn("Cli.mcp.logout")(function* (args) {
    UI.empty()
    prompts.intro(UI.t("mcp.logout"))

    const credentials = yield* McpAuth.Service.use((auth) => auth.all())
    const serverNames = Object.keys(credentials)

    if (serverNames.length === 0) {
      prompts.log.warn(UI.t("mcp.no_credentials"))
      prompts.outro(UI.t("mcp.done"))
      return
    }

    let serverName = args.name
    if (!serverName) {
      const selected = yield* Effect.promise(() =>
        prompts.select({
          message: UI.t("mcp.select_logout_server"),
          options: serverNames.map((name) => {
            const entry = credentials[name]
            const hasTokens = !!entry.tokens
            const hasClient = !!entry.clientInfo
            let hint = ""
            if (hasTokens && hasClient) hint = UI.t("mcp.tokens_client")
            else if (hasTokens) hint = UI.t("mcp.tokens")
            else if (hasClient) hint = UI.t("mcp.client_registration")
            return {
              label: name,
              value: name,
              hint,
            }
          }),
        }),
      )
      if (prompts.isCancel(selected)) throw new UI.CancelledError()
      serverName = selected
    }

    if (!credentials[serverName]) {
      prompts.log.error(UI.t("mcp.no_credentials_for", { name: serverName }))
      prompts.outro(UI.t("mcp.done"))
      return
    }

    yield* MCP.Service.use((mcp) => mcp.removeAuth(serverName))
    prompts.log.success(UI.t("mcp.credentials_removed", { name: serverName }))
    prompts.outro(UI.t("mcp.done"))
  }),
})

async function resolveConfigPath(baseDir: string, global = false) {
  // Check for existing config files (prefer .jsonc over .json, check .miaopanCode/ subdirectory too)
  const candidates = [path.join(baseDir, "miaopan-code.json"), path.join(baseDir, "miaopan-code.jsonc")]

  if (!global) {
    candidates.push(
      path.join(baseDir, ".miaopanCode", "miaopan-code.json"),
      path.join(baseDir, ".miaopanCode", "miaopan-code.jsonc"),
    )
  }

  for (const candidate of candidates) {
    if (await Filesystem.exists(candidate)) {
      return candidate
    }
  }

  // Default to miaopan-code.json if none exist
  return candidates[0]
}

async function addMcpToConfig(name: string, mcpConfig: ConfigMCPV1.Info, configPath: string) {
  let text = "{}"
  if (await Filesystem.exists(configPath)) {
    text = await Filesystem.readText(configPath)
  }

  // Use jsonc-parser to modify while preserving comments
  const edits = modify(text, ["mcp", name], mcpConfig, {
    formattingOptions: { tabSize: 2, insertSpaces: true },
  })
  const result = applyEdits(text, edits)

  await Filesystem.write(configPath, result)

  return configPath
}

export const McpAddCommand = effectCmd({
  command: "add [name]",
  describe: UI.t("cli.mcp_add"),
  builder: (yargs) =>
    yargs
      .positional("name", {
        describe: UI.t("cli.mcp_name"),
        type: "string",
      })
      .option("url", {
        describe: UI.t("cli.mcp_url"),
        type: "string",
      })
      .option("env", {
        describe: UI.t("cli.mcp_env"),
        type: "string",
        array: true,
      })
      .option("header", {
        describe: UI.t("cli.mcp_header"),
        type: "string",
        array: true,
      }),
  handler: Effect.fn("Cli.mcp.add")(function* (args) {
    const maybeCtx = yield* InstanceRef
    if (!maybeCtx) return yield* Effect.die(UI.t("error.instance_ref_missing"))
    const ctx = maybeCtx
    yield* Effect.promise(async () => {
      const command = args["--"] ?? []
      if (!args.name && (args.url || args.env?.length || args.header?.length || command.length)) {
        throw new Error(UI.t("mcp.name_required_noninteractive"))
      }
      if (args.name) {
        if (!!args.url === !!command.length) {
          throw new Error(UI.t("mcp.url_or_command_required"))
        }
        if (args.url && !URL.canParse(args.url)) {
          throw new Error(UI.t("mcp.invalid_url_value", { url: args.url }))
        }
        if (args.url && args.env?.length) {
          throw new Error(UI.t("mcp.env_local_only"))
        }
        if (command.length && args.header?.length) {
          throw new Error(UI.t("mcp.header_remote_only"))
        }

        const entries = (values: string[], kind: string) =>
          Object.fromEntries(
            values.map((entry) => {
              const index = entry.indexOf("=")
              if (index < 1) throw new Error(UI.t("mcp.invalid_env_entry", { kind, entry }))
              return [entry.slice(0, index), entry.slice(index + 1)]
            }),
          )
        const environment = entries(args.env ?? [], UI.t("mcp.environment_variable"))
        const headers = entries(args.header ?? [], UI.t("mcp.http_header"))
        const mcpConfig: ConfigMCPV1.Info = args.url
          ? {
              type: "remote",
              url: args.url,
              ...(Object.keys(headers).length ? { headers } : {}),
            }
          : {
              type: "local",
              command,
              ...(Object.keys(environment).length ? { environment } : {}),
            }

        const configPath = await resolveConfigPath(Global.Path.config, true)
        await addMcpToConfig(args.name, mcpConfig, configPath)
        prompts.log.success(UI.t("mcp.added_to", { name: args.name, path: configPath }))
        return
      }

      UI.empty()
      prompts.intro(UI.t("mcp.add_server"))

      const project = ctx.project

      // Resolve config paths eagerly for hints
      const [projectConfigPath, globalConfigPath] = await Promise.all([
        resolveConfigPath(ctx.worktree),
        resolveConfigPath(Global.Path.config, true),
      ])

      // Determine scope
      let configPath = globalConfigPath
      if (project.vcs === "git") {
        const scopeResult = await prompts.select({
          message: UI.t("mcp.location"),
          options: [
            {
              label: UI.t("mcp.current_project"),
              value: projectConfigPath,
              hint: projectConfigPath,
            },
            {
              label: UI.t("mcp.global"),
              value: globalConfigPath,
              hint: globalConfigPath,
            },
          ],
        })
        if (prompts.isCancel(scopeResult)) throw new UI.CancelledError()
        configPath = scopeResult
      }

      const name = await prompts.text({
        message: UI.t("mcp.enter_name"),
        validate: (x) => (x && x.length > 0 ? undefined : UI.t("mcp.required")),
      })
      if (prompts.isCancel(name)) throw new UI.CancelledError()

      const type = await prompts.select({
        message: UI.t("mcp.select_type"),
        options: [
          {
            label: UI.t("mcp.local"),
            value: "local",
            hint: UI.t("mcp.run_local_command"),
          },
          {
            label: UI.t("mcp.remote"),
            value: "remote",
            hint: UI.t("mcp.connect_remote_url"),
          },
        ],
      })
      if (prompts.isCancel(type)) throw new UI.CancelledError()

      if (type === "local") {
        const command = await prompts.text({
          message: UI.t("mcp.enter_command"),
          placeholder: UI.t("mcp.command_placeholder"),
          validate: (x) => (x && x.length > 0 ? undefined : UI.t("mcp.required")),
        })
        if (prompts.isCancel(command)) throw new UI.CancelledError()

        const mcpConfig: ConfigMCPV1.Info = {
          type: "local",
          command: command.split(" "),
        }

        await addMcpToConfig(name, mcpConfig, configPath)
        prompts.log.success(UI.t("mcp.added_to", { name, path: configPath }))
        prompts.outro(UI.t("mcp.server_added"))
        return
      }

      if (type === "remote") {
        const url = await prompts.text({
          message: UI.t("mcp.enter_url"),
          placeholder: UI.t("mcp.url_placeholder"),
          validate: (x) => {
            if (!x) return UI.t("mcp.required")
            if (x.length === 0) return UI.t("mcp.required")
            const isValid = URL.canParse(x)
            return isValid ? undefined : UI.t("mcp.invalid_url")
          },
        })
        if (prompts.isCancel(url)) throw new UI.CancelledError()

        const useOAuth = await prompts.confirm({
          message: UI.t("mcp.require_oauth"),
          initialValue: false,
        })
        if (prompts.isCancel(useOAuth)) throw new UI.CancelledError()

        let mcpConfig: ConfigMCPV1.Info

        if (useOAuth) {
          const hasClientId = await prompts.confirm({
            message: UI.t("mcp.has_client_id"),
            initialValue: false,
          })
          if (prompts.isCancel(hasClientId)) throw new UI.CancelledError()

          if (hasClientId) {
            const clientId = await prompts.text({
              message: UI.t("mcp.enter_client_id"),
              validate: (x) => (x && x.length > 0 ? undefined : UI.t("mcp.required")),
            })
            if (prompts.isCancel(clientId)) throw new UI.CancelledError()

            const hasSecret = await prompts.confirm({
              message: UI.t("mcp.has_client_secret"),
              initialValue: false,
            })
            if (prompts.isCancel(hasSecret)) throw new UI.CancelledError()

            let clientSecret: string | undefined
            if (hasSecret) {
              const secret = await prompts.password({
                message: UI.t("mcp.enter_client_secret"),
              })
              if (prompts.isCancel(secret)) throw new UI.CancelledError()
              clientSecret = secret
            }

            mcpConfig = {
              type: "remote",
              url,
              oauth: {
                clientId,
                ...(clientSecret && { clientSecret }),
              },
            }
          } else {
            mcpConfig = {
              type: "remote",
              url,
              oauth: {},
            }
          }
        } else {
          mcpConfig = {
            type: "remote",
            url,
          }
        }

        await addMcpToConfig(name, mcpConfig, configPath)
        prompts.log.success(UI.t("mcp.added_to", { name, path: configPath }))
      }

      prompts.outro(UI.t("mcp.server_added"))
    })
  }),
})

export const McpDebugCommand = effectCmd({
  command: "debug <name>",
  describe: UI.t("cli.mcp_debug_oauth"),
  builder: (yargs) =>
    yargs.positional("name", {
      describe: UI.t("cli.mcp_name"),
      type: "string",
      demandOption: true,
    }),
  handler: Effect.fn("Cli.mcp.debug")(function* (args) {
    const config = yield* Config.Service.use((cfg) => cfg.get())
    const mcp = yield* MCP.Service
    const auth = yield* McpAuth.Service
    const serverConfig = config.mcp?.[args.name]
    const authInfo =
      serverConfig && isMcpRemote(serverConfig) && serverConfig.oauth !== false
        ? yield* Effect.all({
            authStatus: mcp.getAuthStatus(args.name),
            entry: auth.get(args.name),
          })
        : undefined
    yield* Effect.promise(async () => {
      UI.empty()
      prompts.intro(UI.t("mcp.auth_debug"))

      const serverName = args.name

      if (!serverConfig) {
        prompts.log.error(UI.t("mcp.server_not_found", { name: serverName }))
        prompts.outro(UI.t("mcp.done"))
        return
      }

      if (!isMcpRemote(serverConfig)) {
        prompts.log.error(UI.t("mcp.not_remote", { name: serverName }))
        prompts.outro(UI.t("mcp.done"))
        return
      }

      if (serverConfig.oauth === false) {
        prompts.log.warn(UI.t("mcp.oauth_disabled", { name: serverName }))
        prompts.outro(UI.t("mcp.done"))
        return
      }

      prompts.log.info(UI.t("mcp.server_label", { name: serverName }))
      prompts.log.info(UI.t("mcp.url_label", { url: serverConfig.url }))

      const { authStatus, entry } = authInfo!
      prompts.log.info(
        UI.t("mcp.auth_status_label", { status: `${getAuthStatusIcon(authStatus)} ${getAuthStatusText(authStatus)}` }),
      )

      if (entry?.tokens) {
        prompts.log.info(
          `  ${UI.t("mcp.access_token", {
            token:
              entry.tokens.accessToken.length > 8
                ? `${entry.tokens.accessToken.slice(0, 4)}***${entry.tokens.accessToken.slice(-4)}`
                : "***",
          })}`,
        )
        if (entry.tokens.expiresAt) {
          const expiresDate = new Date(entry.tokens.expiresAt * 1000)
          const isExpired = entry.tokens.expiresAt < Date.now() / 1000
          prompts.log.info(
            UI.t("mcp.expires", {
              date: expiresDate.toISOString(),
              expired: isExpired ? `(${UI.t("mcp.status_expired")})` : "",
            }),
          )
        }
        if (entry.tokens.refreshToken) {
          prompts.log.info(UI.t("mcp.refresh_present"))
        }
      }
      if (entry?.clientInfo) {
        prompts.log.info(UI.t("mcp.client_id", { id: entry.clientInfo.clientId }))
        if (entry.clientInfo.clientSecretExpiresAt) {
          const expiresDate = new Date(entry.clientInfo.clientSecretExpiresAt * 1000)
          prompts.log.info(UI.t("mcp.client_secret_expires", { date: expiresDate.toISOString() }))
        }
      }

      const spinner = prompts.spinner()
      spinner.start(UI.t("mcp.testing_connection"))

      // Test basic HTTP connectivity first
      try {
        const response = await fetch(serverConfig.url, {
          method: "POST",
          headers: {
            ...serverConfig.headers,
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "initialize",
            params: {
              protocolVersion: LATEST_PROTOCOL_VERSION,
              capabilities: {},
              clientInfo: { name: "miaopanCode-debug", version: InstallationVersion },
            },
            id: 1,
          }),
        })

        spinner.stop(UI.t("mcp.http_response", { status: response.status, text: response.statusText }))

        // Check for WWW-Authenticate header
        const wwwAuth = response.headers.get("www-authenticate")
        if (wwwAuth) {
          prompts.log.info(`WWW-Authenticate: ${wwwAuth}`)
        }

        if (response.status === 401) {
          prompts.log.info(UI.t("mcp.oauth_unauthenticated"))

          // Try to discover OAuth metadata
          const oauthConfig = typeof serverConfig.oauth === "object" ? serverConfig.oauth : undefined
          const authProvider = new McpOAuthProvider(
            serverName,
            serverConfig.url,
            {
              clientId: oauthConfig?.clientId,
              clientSecret: oauthConfig?.clientSecret,
              scope: oauthConfig?.scope,
              redirectUri: oauthConfig?.redirectUri,
            },
            {
              onRedirect: async () => {},
            },
            auth,
          )

          prompts.log.info(UI.t("mcp.testing_oauth"))

          // Try creating transport with auth provider to trigger discovery
          const transport = new StreamableHTTPClientTransport(new URL(serverConfig.url), {
            authProvider,
            requestInit: serverConfig.headers ? { headers: serverConfig.headers } : undefined,
          })

          try {
            const client = new Client({
              name: "miaopanCode-debug",
              version: InstallationVersion,
            })
            await client.connect(transport)
            prompts.log.success(UI.t("mcp.connection_success"))
            await client.close()
          } catch (error) {
            if (error instanceof UnauthorizedError) {
              prompts.log.info(UI.t("mcp.oauth_flow_triggered", { message: error.message }))

              // Check if dynamic registration would be attempted
              const clientInfo = await authProvider.clientInformation()
              if (clientInfo) {
                prompts.log.info(UI.t("mcp.client_id_available", { id: clientInfo.client_id }))
              } else {
                prompts.log.info(UI.t("mcp.no_client_id"))
              }
            } else {
              prompts.log.error(
                UI.t("mcp.connection_error", { message: error instanceof Error ? error.message : String(error) }),
              )
            }
          }
        } else if (response.status >= 200 && response.status < 300) {
          prompts.log.success(UI.t("mcp.server_response_success"))
          const body = await response.text()
          try {
            const json = JSON.parse(body)
            if (json.result?.serverInfo) {
              prompts.log.info(UI.t("mcp.server_info", { info: JSON.stringify(json.result.serverInfo) }))
            }
          } catch {
            // Not JSON, ignore
          }
        } else {
          prompts.log.warn(UI.t("mcp.unexpected_http_status", { status: response.status }))
          const body = await response.text().catch(() => "")
          if (body) {
            prompts.log.info(UI.t("mcp.response_body", { body: body.substring(0, 500) }))
          }
        }
      } catch (error) {
        spinner.stop(UI.t("mcp.connection_failed"), 1)
        prompts.log.error(UI.t("mcp.error", { message: error instanceof Error ? error.message : String(error) }))
      }

      prompts.outro(UI.t("mcp.debug_complete"))
    })
  }),
})
