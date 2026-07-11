import { Effect } from "effect"
import { HttpApiMiddleware } from "effect/unstable/httpapi"
import { InvalidRequestError } from "@miaopan-code/protocol/errors"
import { SchemaErrorMiddleware } from "@miaopan-code/protocol/middleware/schema-error"
import { t, type Language } from "@miaopan-code/core/i18n"
import { requestLanguage } from "../i18n"
export { SchemaErrorMiddleware } from "@miaopan-code/protocol/middleware/schema-error"

const REASON_LIMIT = 1024

function truncateReason(reason: string, language: Language) {
  if (reason.length <= REASON_LIMIT) return reason
  return reason.slice(0, REASON_LIMIT) + t(language, "error.more_chars", { count: reason.length - REASON_LIMIT })
}

export const schemaErrorLayer = HttpApiMiddleware.layerSchemaErrorTransform(SchemaErrorMiddleware, (error) => {
  return Effect.gen(function* () {
    const language = yield* requestLanguage()
    const reason = truncateReason(error.cause.message, language)
    return yield* Effect.logWarning(t(language, "log.server_schema_rejection")).pipe(
      Effect.annotateLogs({ kind: error.kind, reason }),
      Effect.andThen(Effect.fail(new InvalidRequestError({ message: reason, kind: error.kind }))),
    )
  })
})
