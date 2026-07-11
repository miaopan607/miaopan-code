import { Effect } from "effect"
import { t, type Language } from "@miaopan-code/core/i18n"
import { requestLanguage } from "@miaopan-code/server/i18n"
import { HttpServerResponse } from "effect/unstable/http"
import { HttpApiMiddleware } from "effect/unstable/httpapi"
import { InvalidRequestError } from "../errors"

// Effect's Issue formatter recursively dumps the rejected `actual` value with
// no truncation, so a 5KB invalid array produces a ~360KB string. Cap to keep
// 4xx responses small and avoid mirroring entire request payloads (which may
// contain secrets) into the response body and log file.
const REASON_LIMIT = 1024
function truncateReason(reason: string, language: Language) {
  if (reason.length <= REASON_LIMIT) return reason
  return reason.slice(0, REASON_LIMIT) + t(language, "error.more_chars", { count: reason.length - REASON_LIMIT })
}

// Default Respondable returns an empty 400 body. Match the NamedError shape
// used by other 4xx/5xx so the SDK's `wrapClientError` extracts `.data.message`.
export class SchemaErrorMiddleware extends HttpApiMiddleware.Service<SchemaErrorMiddleware>()(
  "@miaopan-code/HttpApiSchemaError",
  {
    error: InvalidRequestError,
  },
) {}

export const schemaErrorLayer = HttpApiMiddleware.layerSchemaErrorTransform(SchemaErrorMiddleware, (error, context) => {
  return requestLanguage().pipe(
    Effect.flatMap((language) => {
      const reason = truncateReason(error.cause.message, language)
      const response = context.endpoint.path.startsWith("/api/")
        ? Effect.fail(
            new InvalidRequestError({
              message: reason,
              kind: error.kind,
            }),
          )
        : Effect.succeed(
            HttpServerResponse.jsonUnsafe(
              { name: "BadRequest", data: { message: reason, kind: error.kind } },
              { status: 400 },
            ),
          )
      return Effect.logWarning(t(language, "log.server_schema_rejection"), { kind: error.kind, reason }).pipe(
        Effect.andThen(response),
      )
    }),
  )
})
