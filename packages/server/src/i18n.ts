import { Effect, Option } from "effect"
import { HttpServerRequest } from "effect/unstable/http"
import { resolveLanguage, type Language } from "@miaopan-code/core/i18n"

export function fromAcceptLanguage(input: string | undefined): Language {
  const preferred = input
    ?.split(",")
    .map((value, index) => {
      const [tag, ...parameters] = value.trim().toLowerCase().split(";")
      const quality = Number(
        parameters
          .find((parameter) => parameter.trim().startsWith("q="))
          ?.trim()
          .slice(2) ?? 1,
      )
      return { tag, quality: Number.isFinite(quality) ? quality : 0, index }
    })
    .filter((value) => value.quality > 0)
    .toSorted((a, b) => b.quality - a.quality || a.index - b.index)
    .find(
      (value) =>
        value.tag === "en" || value.tag?.startsWith("en-") || value.tag === "zh" || value.tag?.startsWith("zh-"),
    )
  return resolveLanguage(preferred?.tag === "en" || preferred?.tag?.startsWith("en-") ? "en" : undefined)
}

export const requestLanguage = Effect.fn("ServerI18n.requestLanguage")(function* () {
  const request = Option.getOrUndefined(yield* Effect.serviceOption(HttpServerRequest.HttpServerRequest))
  return fromAcceptLanguage(request?.headers["accept-language"])
})

export * as ServerI18n from "./i18n"
