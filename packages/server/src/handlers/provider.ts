import { Catalog } from "@miaopan-code/core/catalog"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { Api } from "../api"
import { ProviderNotFoundError } from "@miaopan-code/protocol/errors"
import { response } from "../location"
import { t } from "@miaopan-code/core/i18n"
import { requestLanguage } from "../i18n"

export const ProviderHandler = HttpApiBuilder.group(Api, "server.provider", (handlers) =>
  Effect.gen(function* () {
    return handlers
      .handle(
        "provider.list",
        Effect.fn(function* () {
          const catalog = yield* Catalog.Service
          return yield* response(catalog.provider.available())
        }),
      )
      .handle(
        "provider.get",
        Effect.fn(function* (ctx) {
          const catalog = yield* Catalog.Service
          const language = yield* requestLanguage()
          const provider = yield* catalog.provider.get(ctx.params.providerID)
          if (!provider)
            return yield* new ProviderNotFoundError({
              providerID: ctx.params.providerID,
              message: t(language, "error.provider_not_found", { id: ctx.params.providerID }),
            })
          return yield* response(Effect.succeed(provider))
        }),
      )
  }),
)
