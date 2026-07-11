import { Effect, Exit, Option } from "effect"
import { Config } from "@/config/config"
import { t, type Language, type MessageKey, type MessageParameters } from "@miaopan-code/core/i18n"
import { PromptI18n, type PromptKey } from "@/i18n/prompt"
import type { Context } from "./tool"
import { InstanceRef } from "@/effect/instance-ref"

export function description(key: PromptKey) {
  return Effect.gen(function* () {
    const resolved = yield* resolvedConfig()
    return PromptI18n.text(resolved?.language, key)
  })
}

export function configuredText(key: MessageKey, parameters?: MessageParameters) {
  return Effect.gen(function* () {
    const resolved = yield* resolvedConfig()
    return t(resolved?.language, key, parameters)
  })
}

export function language() {
  return Effect.gen(function* () {
    return configuredLanguage((yield* resolvedConfig())?.language)
  })
}

function resolvedConfig() {
  return Effect.gen(function* () {
    if (!(yield* InstanceRef)) return undefined
    const config = yield* Effect.serviceOption(Config.Service)
    const service = Option.getOrUndefined(config)
    if (!service) return undefined
    const resolved = yield* Effect.exit(service.get())
    return Exit.isSuccess(resolved) ? resolved.value : undefined
  })
}

export function text(ctx: Pick<Context, "language"> | undefined, key: MessageKey, parameters?: MessageParameters) {
  return t(ctx?.language ?? "zh-CN", key, parameters)
}

export function configuredLanguage(input: unknown): Language {
  return input === "en" ? "en" : "zh-CN"
}

export * as ToolI18n from "./i18n"
