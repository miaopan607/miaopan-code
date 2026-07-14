export * as ConfigRetry from "./retry"

import { Effect, Schema } from "effect"
import { NonNegativeInt } from "../schema"
import { zh } from "../i18n"

export const Category = Schema.Literals([
  "network",
  "timeout",
  "response",
  "validation",
  "rate_limit",
  "forbidden",
  "server",
  "unknown",
]).annotate({
  identifier: "Config.RetryCategory",
})

export type Category = typeof Category.Type

const BackoffFactor = Schema.Finite.check(Schema.isGreaterThanOrEqualTo(1))

const JitterPercent = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 100 }))

const optionalDefault = <S extends Schema.Top>(schema: S, value: Schema.Schema.Type<S>, description: string) =>
  schema.annotate({ description }).pipe(Schema.optional, Schema.withDecodingDefault(Effect.succeed(value)))

export class Info extends Schema.Class<Info>("Config.Retry")({
  stream_max_retries: optionalDefault(NonNegativeInt, 10, zh("config.retry.stream_max_retries")),
  stream_initial_delay_ms: optionalDefault(NonNegativeInt, 200, zh("config.retry.stream_initial_delay_ms")),
  stream_backoff_factor: optionalDefault(BackoffFactor, 2, zh("config.retry.stream_backoff_factor")),
  stream_max_delay_ms: optionalDefault(NonNegativeInt, 3200, zh("config.retry.stream_max_delay_ms")),
  stream_jitter_percent: optionalDefault(JitterPercent, 10, zh("config.retry.stream_jitter_percent")),
  http_max_retries: optionalDefault(NonNegativeInt, 10, zh("config.retry.http_max_retries")),
  http_initial_delay_ms: optionalDefault(NonNegativeInt, 200, zh("config.retry.http_initial_delay_ms")),
  http_backoff_factor: optionalDefault(BackoffFactor, 2, zh("config.retry.http_backoff_factor")),
  http_max_delay_ms: optionalDefault(NonNegativeInt, 1600, zh("config.retry.http_max_delay_ms")),
  http_jitter_percent: optionalDefault(JitterPercent, 10, zh("config.retry.http_jitter_percent")),
  respect_retry_after: optionalDefault(Schema.Boolean, true, zh("config.retry.respect_retry_after")),
  retry_on: Schema.Array(Category)
    .annotate({ description: zh("config.retry.retry_on") })
    .pipe(
      Schema.optional,
      Schema.withDecodingDefault(
        Effect.succeed([
          "network",
          "timeout",
          "response",
          "validation",
          "rate_limit",
          "forbidden",
          "server",
          "unknown",
        ]),
      ),
    ),
}) {}
