import type { Argv } from "yargs"
import { Auth } from "../../auth"
import { cmd } from "./cmd"
import { CliError, effectCmd, fail } from "../effect-cmd"
import { UI } from "../ui"
import * as Prompt from "../effect/prompt"
import { ModelsDev } from "@miaopan-code/core/models-dev"

import { map, pipe, sortBy, values } from "remeda"
import path from "path"
import os from "os"
import { Config } from "@/config/config"
import { Global } from "@miaopan-code/core/global"
import { Plugin } from "../../plugin"
import type { Hooks } from "@miaopan/plugin"
import { Process } from "@/util/process"
import { errorMessage } from "@/util/error"
import { text } from "node:stream/consumers"
import { Effect, Option } from "effect"
import { ProviderV2 } from "@miaopan-code/core/provider"

type PluginAuth = NonNullable<Hooks["auth"]>

const promptValue = <Value>(value: Option.Option<Value>) => {
  if (Option.isNone(value)) return Effect.die(new UI.CancelledError())
  return Effect.succeed(value.value)
}

const put = Effect.fn("Cli.providers.put")(function* (key: string, info: Auth.Info) {
  const auth = yield* Auth.Service
  yield* Effect.orDie(auth.set(key, info))
})

const cliTry = <Value>(message: string, fn: () => PromiseLike<Value>) =>
  Effect.tryPromise({
    try: fn,
    catch: (error) => new CliError({ message: message + errorMessage(error) }),
  })

const handlePluginAuth = Effect.fn("Cli.providers.pluginAuth")(function* (
  plugin: { auth: PluginAuth },
  provider: string,
  methodName?: string,
) {
  const index = yield* Effect.gen(function* () {
    if (!methodName) {
      if (plugin.auth.methods.length <= 1) return 0
      return yield* promptValue(
        yield* Prompt.select({
          message: UI.t("provider.login_method"),
          options: plugin.auth.methods.map((x, index) => ({
            label: x.label,
            value: index,
          })),
        }),
      )
    }
    const match = plugin.auth.methods.findIndex((x) => x.label.toLowerCase() === methodName.toLowerCase())
    if (match === -1) {
      return yield* fail(
        UI.t("provider.unknown_method", {
          method: methodName,
          provider,
          available: plugin.auth.methods.map((x) => x.label).join(", "),
        }),
      )
    }
    return match
  })
  const method = plugin.auth.methods[index]

  yield* Effect.sleep("10 millis")
  const inputs: Record<string, string> = {}
  if (method.prompts) {
    for (const prompt of method.prompts) {
      if (prompt.when) {
        const value = inputs[prompt.when.key]
        if (value === undefined) continue
        const matches = prompt.when.op === "eq" ? value === prompt.when.value : value !== prompt.when.value
        if (!matches) continue
      }
      if (prompt.condition && !prompt.condition(inputs)) continue
      if (prompt.type === "select") {
        const value = yield* Prompt.select({
          message: prompt.message,
          options: prompt.options,
        })
        inputs[prompt.key] = yield* promptValue(value)
        continue
      }
      const value = yield* Prompt.text({
        message: prompt.message,
        placeholder: prompt.placeholder,
        validate: prompt.validate ? (v) => prompt.validate!(v ?? "") : undefined,
      })
      inputs[prompt.key] = yield* promptValue(value)
    }
  }

  if (method.type === "oauth") {
    const authorize = yield* cliTry(UI.t("provider.failed_authorize_prefix"), () => method.authorize(inputs))

    if (authorize.url) {
      yield* Prompt.log.info(UI.t("account.go_to") + authorize.url)
    }

    if (authorize.method === "auto") {
      if (authorize.instructions) {
        yield* Prompt.log.info(authorize.instructions)
      }
      const spinner = Prompt.spinner()
      yield* spinner.start(UI.t("provider.wait_authorization"))
      const result = yield* cliTry(UI.t("provider.failed_authorize_prefix"), () => authorize.callback())
      if (result.type === "failed") {
        yield* spinner.stop(UI.t("provider.failed_authorize"), 1)
      }
      if (result.type === "success") {
        const saveProvider = result.provider ?? provider
        if ("refresh" in result) {
          const { type: _, provider: __, refresh, access, expires, ...extraFields } = result
          yield* put(saveProvider, {
            type: "oauth",
            refresh,
            access,
            expires,
            ...extraFields,
          })
        }
        if ("key" in result) {
          yield* put(saveProvider, {
            type: "api",
            key: result.key,
            ...(result.metadata ? { metadata: result.metadata } : {}),
          })
        }
        yield* spinner.stop(UI.t("provider.login_success"))
      }
    }

    if (authorize.method === "code") {
      const code = yield* Prompt.text({
        message: UI.t("provider.paste_code"),
        validate: (x) => (x && x.length > 0 ? undefined : UI.t("provider.required")),
      })
      const authorizationCode = yield* promptValue(code)
      const result = yield* cliTry(UI.t("provider.failed_authorize_prefix"), () =>
        authorize.callback(authorizationCode),
      )
      if (result.type === "failed") {
        yield* Prompt.log.error(UI.t("provider.failed_authorize"))
      }
      if (result.type === "success") {
        const saveProvider = result.provider ?? provider
        if ("refresh" in result) {
          const { type: _, provider: __, refresh, access, expires, ...extraFields } = result
          yield* put(saveProvider, {
            type: "oauth",
            refresh,
            access,
            expires,
            ...extraFields,
          })
        }
        if ("key" in result) {
          yield* put(saveProvider, {
            type: "api",
            key: result.key,
            ...(result.metadata ? { metadata: result.metadata } : {}),
          })
        }
        yield* Prompt.log.success(UI.t("provider.login_success"))
      }
    }

    yield* Prompt.outro(UI.t("account.done"))
    return true
  }

  if (method.type === "api") {
    const key = yield* Prompt.password({
      message: UI.t("provider.enter_api_key"),
      validate: (x) => (x && x.length > 0 ? undefined : UI.t("provider.required")),
    })
    const apiKey = yield* promptValue(key)

    const metadata = Object.keys(inputs).length ? { metadata: inputs } : {}
    const authorizeApi = method.authorize
    if (!authorizeApi) {
      yield* put(provider, {
        type: "api",
        key: apiKey,
        ...metadata,
      })
      yield* Prompt.outro(UI.t("account.done"))
      return true
    }

    const result = yield* cliTry(UI.t("provider.failed_authorize_prefix"), () => authorizeApi(inputs))
    if (result.type === "failed") {
      yield* Prompt.log.error(UI.t("provider.failed_authorize"))
    }
    if (result.type === "success") {
      const saveProvider = result.provider ?? provider
      const merged = { ...(metadata.metadata ?? {}), ...(result.metadata ?? {}) }
      yield* put(saveProvider, {
        type: "api",
        key: result.key ?? apiKey,
        ...(Object.keys(merged).length ? { metadata: merged } : {}),
      })
      yield* Prompt.log.success(UI.t("provider.login_success"))
    }
    yield* Prompt.outro(UI.t("account.done"))
    return true
  }

  return false
})

export function resolvePluginProviders(input: {
  hooks: Hooks[]
  existingProviders: Record<string, unknown>
  disabled: Set<string>
  enabled?: Set<string>
  providerNames: Record<string, string | undefined>
}): Array<{ id: string; name: string }> {
  const seen = new Set<string>()
  const result: Array<{ id: string; name: string }> = []

  for (const hook of input.hooks) {
    if (!hook.auth) continue
    const id = hook.auth.provider
    if (seen.has(id)) continue
    seen.add(id)
    if (Object.hasOwn(input.existingProviders, id)) continue
    if (input.disabled.has(id)) continue
    if (input.enabled && !input.enabled.has(id)) continue
    result.push({
      id,
      name: input.providerNames[id] ?? id,
    })
  }

  return result
}

export const ProvidersCommand = cmd({
  command: "providers",
  aliases: ["auth"],
  describe: UI.t("cli.providers_manage"),
  builder: (yargs) =>
    yargs.command(ProvidersListCommand).command(ProvidersLoginCommand).command(ProvidersLogoutCommand).demandCommand(),
  async handler() {},
})

export const ProvidersListCommand = effectCmd({
  command: "list",
  aliases: ["ls"],
  describe: UI.t("cli.providers_list"),
  // Lists global credentials + provider env vars; no project instance needed.
  instance: false,
  handler: Effect.fn("Cli.providers.list")(function* (_args) {
    const authSvc = yield* Auth.Service
    const modelsDev = yield* ModelsDev.Service

    UI.empty()
    const authPath = path.join(Global.Path.data, "auth.json")
    const homedir = os.homedir()
    const displayPath = authPath.startsWith(homedir) ? authPath.replace(homedir, "~") : authPath
    yield* Prompt.intro(`${UI.t("provider.credentials")} ${UI.Style.TEXT_DIM}${displayPath}`)
    const results = Object.entries(yield* Effect.orDie(authSvc.all()))
    const { Provider } = yield* Effect.promise(() => import("@/provider/provider"))
    const database = Provider.normalizeModelsDevProviders(yield* modelsDev.get())

    for (const [providerID, result] of results) {
      const name = database[providerID]?.name || providerID
      yield* Prompt.log.info(`${name} ${UI.Style.TEXT_DIM}${result.type}`)
    }

    yield* Prompt.outro(UI.t("provider.credentials_count", { count: results.length }))

    const activeEnvVars: Array<{ provider: string; envVar: string }> = []

    for (const [providerID, provider] of Object.entries(database)) {
      for (const envVar of provider.env) {
        if (process.env[envVar]) {
          activeEnvVars.push({
            provider: provider.name || providerID,
            envVar,
          })
        }
      }
    }

    if (activeEnvVars.length > 0) {
      UI.empty()
      yield* Prompt.intro(UI.t("provider.environment"))

      for (const { provider, envVar } of activeEnvVars) {
        yield* Prompt.log.info(`${provider} ${UI.Style.TEXT_DIM}${envVar}`)
      }

      yield* Prompt.outro(UI.t("provider.environment_count", { count: activeEnvVars.length }))
    }
  }),
})

export const ProvidersLoginCommand = effectCmd({
  command: "login [url]",
  describe: UI.t("cli.provider_login"),
  // URL login skips instance bootstrap, which would load remote config with the stale token and crash before re-auth.
  instance: (args) => !args.url,
  builder: (yargs: Argv) =>
    yargs
      .positional("url", {
        describe: UI.t("cli.provider_auth"),
        type: "string",
      })
      .option("provider", {
        alias: ["p"],
        describe: UI.t("cli.provider_id"),
        type: "string",
      })
      .option("method", {
        alias: ["m"],
        describe: UI.t("cli.login_method"),
        type: "string",
      }),
  handler: Effect.fn("Cli.providers.login")(function* (args) {
    const authSvc = yield* Auth.Service

    UI.empty()
    yield* Prompt.intro(UI.t("provider.add_credential"))
    if (args.url) {
      const url = args.url.replace(/\/+$/, "")
      const wellknown = (yield* cliTry(UI.t("provider.failed_metadata", { url }), () =>
        fetch(`${url}/.well-known/miaopanCode`).then((x) => x.json()),
      )) as {
        auth: { command: string[]; env: string }
      }
      yield* Prompt.log.info(UI.t("provider.running_command", { command: wellknown.auth.command.join(" ") }))
      const abort = new AbortController()
      const proc = Process.spawn(wellknown.auth.command, { stdout: "pipe", stderr: "inherit", abort: abort.signal })
      if (!proc.stdout) {
        yield* Prompt.log.error(UI.t("provider.failed_authorize"))
        yield* Prompt.outro(UI.t("account.done"))
        return
      }
      const [exit, token] = yield* cliTry(UI.t("provider.failed_command"), () =>
        Promise.all([proc.exited, text(proc.stdout!)]),
      ).pipe(Effect.ensuring(Effect.sync(() => abort.abort())))
      if (exit !== 0) {
        yield* Prompt.log.error(UI.t("provider.failed_authorize"))
        yield* Prompt.outro(UI.t("account.done"))
        return
      }
      yield* Effect.orDie(authSvc.set(url, { type: "wellknown", key: wellknown.auth.env, token: token.trim() }))
      yield* Prompt.log.success(UI.t("provider.logged_in", { url }))
      yield* Prompt.outro(UI.t("account.done"))
      return
    }

    const cfgSvc = yield* Config.Service
    const pluginSvc = yield* Plugin.Service
    const modelsDev = yield* ModelsDev.Service
    yield* Effect.ignore(modelsDev.refresh(true))

    const config = yield* cfgSvc.get()

    const { Provider } = yield* Effect.promise(() => import("@/provider/provider"))
    const disabled = new Set<string>((config.disabled_providers ?? []).map(ProviderV2.canonicalID))
    const enabled = config.enabled_providers
      ? new Set<string>(config.enabled_providers.map(ProviderV2.canonicalID))
      : undefined

    const allProviders = Provider.normalizeModelsDevProviders(yield* modelsDev.get())
    const providers: Record<string, (typeof allProviders)[string]> = {}
    for (const [key, value] of Object.entries(allProviders)) {
      if ((enabled ? enabled.has(key) : true) && !disabled.has(key)) providers[key] = value
    }
    const hooks = yield* pluginSvc.list()

    const priority: Record<string, number> = {
      opencode: 0,
      "opencode-go": 1,
      openai: 2,
      "github-copilot": 3,
      google: 4,
      anthropic: 5,
      openrouter: 6,
      vercel: 7,
    }
    const pluginProviders = resolvePluginProviders({
      hooks,
      existingProviders: providers,
      disabled,
      enabled,
      providerNames: Object.fromEntries(Object.entries(config.provider ?? {}).map(([id, p]) => [id, p.name])),
    })
    const options = [
      ...pipe(
        providers,
        values(),
        sortBy(
          (x) => priority[x.id] ?? 99,
          (x) => x.name ?? x.id,
        ),
        map((x) => ({
          label: x.name,
          value: x.id,
          hint: {
            miaopanCode: UI.t("github.recommended"),
            openai: UI.t("provider.plus_or_api"),
          }[x.id],
        })),
      ),
      ...pluginProviders.map((x) => ({
        label: x.name,
        value: x.id,
        hint: "plugin",
      })),
    ]

    let provider: string
    if (args.provider) {
      const input = args.provider
      const byID = options.find((x) => x.value === input)
      const byName = options.find((x) => x.label.toLowerCase() === input.toLowerCase())
      const match = byID ?? byName
      if (!match) {
        return yield* fail(UI.t("provider.unknown", { provider: input }))
      }
      provider = match.value
    } else {
      provider = yield* promptValue(
        yield* Prompt.autocomplete({
          message: UI.t("provider.select_provider"),
          maxItems: 8,
          options: [...options, { value: "other", label: UI.t("provider.other") }],
        }),
      )
    }

    const plugin = hooks.findLast((x) => x.auth?.provider === provider)
    if (plugin && plugin.auth) {
      const handled = yield* handlePluginAuth({ auth: plugin.auth! }, provider, args.method)
      if (handled) return
    }

    if (provider === "other") {
      provider = (yield* promptValue(
        yield* Prompt.text({
          message: UI.t("provider.enter_id"),
          validate: (x) => (x && x.match(/^[0-9a-z-]+$/) ? undefined : UI.t("provider.id_format")),
        }),
      )).replace(/^@ai-sdk\//, "")

      const customPlugin = hooks.findLast((x) => x.auth?.provider === provider)
      if (customPlugin && customPlugin.auth) {
        const handled = yield* handlePluginAuth({ auth: customPlugin.auth! }, provider, args.method)
        if (handled) return
      }

      yield* Prompt.log.warn(UI.t("provider.custom_credential_warning", { provider }))
    }

    if (provider === "amazon-bedrock") {
      yield* Prompt.log.info(UI.t("provider.bedrock_priority"))
    }

    if (provider === "opencode") {
      yield* Prompt.log.info(UI.t("provider.create_opencode_key"))
    }

    if (provider === "vercel") {
      yield* Prompt.log.info(UI.t("provider.create_vercel_key"))
    }

    if (["cloudflare", "cloudflare-ai-gateway"].includes(provider)) {
      yield* Prompt.log.info(UI.t("provider.cloudflare_hint"))
    }

    const key = yield* Prompt.password({
      message: UI.t("provider.enter_api_key"),
      validate: (x) => (x && x.length > 0 ? undefined : UI.t("provider.required")),
    })
    const apiKey = yield* promptValue(key)
    yield* Effect.orDie(authSvc.set(provider, { type: "api", key: apiKey }))

    yield* Prompt.outro(UI.t("account.done"))
  }),
})

export const ProvidersLogoutCommand = effectCmd({
  command: "logout [provider]",
  describe: UI.t("cli.provider_logout"),
  builder: (yargs) =>
    yargs.positional("provider", {
      describe: UI.t("cli.provider_logout_id"),
      type: "string",
    }),
  // Removes a global auth credential; no project instance needed.
  instance: false,
  handler: Effect.fn("Cli.providers.logout")(function* (args) {
    const authSvc = yield* Auth.Service
    const modelsDev = yield* ModelsDev.Service

    UI.empty()
    const credentials: Array<[string, Auth.Info]> = Object.entries(yield* Effect.orDie(authSvc.all()))
    yield* Prompt.intro(UI.t("provider.remove_credential"))
    if (credentials.length === 0) {
      yield* Prompt.log.error(UI.t("provider.no_credentials"))
      return
    }
    const { Provider } = yield* Effect.promise(() => import("@/provider/provider"))
    const database = Provider.normalizeModelsDevProviders(yield* modelsDev.get())
    const options = credentials.map(([key, value]) => ({
      label: (database[key]?.name || key) + UI.Style.TEXT_DIM + " (" + value.type + ")",
      value: key,
    }))
    const provider = args.provider
      ? options.find(
          (option) =>
            option.value === args.provider ||
            database[option.value]?.name?.toLowerCase() === args.provider?.toLowerCase(),
        )?.value
      : yield* promptValue(
          yield* Prompt.autocomplete({
            message: UI.t("provider.select_provider"),
            maxItems: 8,
            options,
          }),
        )
    if (!provider) return yield* fail(UI.t("provider.unknown_configured", { provider: args.provider }))
    yield* Effect.orDie(authSvc.remove(provider))
    yield* Prompt.outro(UI.t("provider.logout_success"))
  }),
})
