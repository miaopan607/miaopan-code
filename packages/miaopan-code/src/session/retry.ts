import type { NamedError } from "@miaopan-code/core/util/error"
import { ConfigRetry } from "@miaopan-code/core/config/retry"
import { SessionV1 } from "@miaopan-code/core/v1/session"
import { Cause, Clock, Duration, Effect, Random, Schedule } from "effect"
import { APICallError, InvalidResponseDataError, JSONParseError } from "ai"
import { iife } from "@/util/iife"
import { isRecord } from "@/util/record"
import { t, type Language } from "@miaopan-code/core/i18n"

export type Err = ReturnType<NamedError["toObject"]>
export type RetryCategory = ConfigRetry.Category
export type RetryLayer = "stream" | "http"

export const GO_UPSELL_MESSAGE = t(undefined, "session.go_upsell_short")
export const GO_UPSELL_URL = "https://opencode.ai/go"
export type RetryReason = "free_tier_limit" | "account_rate_limit" | (string & {})

export type Retryable = {
  message: string
  action?: {
    reason: RetryReason
    provider: string
    title: string
    message: string
    label: string
    link?: string
  }
}

export type RetryOptions = {
  stream_max_retries?: number
  stream_initial_delay_ms?: number
  stream_backoff_factor?: number
  stream_max_delay_ms?: number
  stream_jitter_percent?: number
  http_max_retries?: number
  http_initial_delay_ms?: number
  http_backoff_factor?: number
  http_max_delay_ms?: number
  http_jitter_percent?: number
  respect_retry_after?: boolean
  retry_on?: readonly RetryCategory[]
}

export type RetryConfig = {
  stream_max_retries: number
  stream_initial_delay_ms: number
  stream_backoff_factor: number
  stream_max_delay_ms: number
  stream_jitter_percent: number
  http_max_retries: number
  http_initial_delay_ms: number
  http_backoff_factor: number
  http_max_delay_ms: number
  http_jitter_percent: number
  respect_retry_after: boolean
  retry_on: readonly RetryCategory[]
}

export const DEFAULT_RETRY_ON: readonly RetryCategory[] = [
  "network",
  "timeout",
  "response",
  "validation",
  "rate_limit",
  "forbidden",
  "server",
]

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  stream_max_retries: 5,
  stream_initial_delay_ms: 200,
  stream_backoff_factor: 2,
  stream_max_delay_ms: 3200,
  stream_jitter_percent: 10,
  http_max_retries: 4,
  http_initial_delay_ms: 200,
  http_backoff_factor: 2,
  http_max_delay_ms: 1600,
  http_jitter_percent: 10,
  respect_retry_after: true,
  retry_on: DEFAULT_RETRY_ON,
}

const NETWORK_CODES = [
  "econnreset",
  "econnrefused",
  "enotfound",
  "eai_again",
  "etimedout",
  "econnaborted",
  "epipe",
  "und_err_socket",
  "socket",
]

const HARD_FAILURE_PATTERNS = [
  "insufficient_quota",
  "usage_not_included",
  "quota exceeded",
  "current quota",
  "out of credits",
  "insufficient credits",
  "credit balance",
  "billing",
  "subscription does not support",
  "subscription doesn't support",
  "subscription quota",
  "not supported by your subscription",
  "plan does not support",
  "content policy",
  "content_filter",
  "security policy",
  "safety policy",
  "safety system",
  "permission denied",
  "insufficient permission",
  "sandbox denied",
  "sandbox policy",
  "policy denied",
  "operation not permitted",
  "invalid prompt",
  "invalid parameter",
  "invalid argument",
  "invalid request",
  "malformed request",
  "unsupported parameter",
]

export const RETRY_MAX_DELAY = 2_147_483_647

export class StructuredOutputValidationError extends Error {
  override readonly name = "StructuredOutputValidationError"

  constructor(
    message: string,
    readonly responseBody?: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }

  static isInstance(error: unknown): error is StructuredOutputValidationError {
    return error instanceof StructuredOutputValidationError
  }
}

export class ProviderStreamError extends Error {
  override readonly name = "ProviderStreamError"

  constructor(
    message: string,
    readonly retryable: boolean,
    readonly classification?: "context-overflow",
  ) {
    super(message)
  }
}

export class HttpRetryError extends Error {
  override readonly name = "HttpRetryError"
  readonly phase = "http" as const

  constructor(
    override readonly cause: unknown,
    readonly attempts: number,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause })
  }
}

export function resolveConfig(input?: RetryOptions): RetryConfig {
  return {
    stream_max_retries: nonNegativeInteger(input?.stream_max_retries, DEFAULT_RETRY_CONFIG.stream_max_retries),
    stream_initial_delay_ms: nonNegativeInteger(
      input?.stream_initial_delay_ms,
      DEFAULT_RETRY_CONFIG.stream_initial_delay_ms,
    ),
    stream_backoff_factor: positiveFinite(input?.stream_backoff_factor, DEFAULT_RETRY_CONFIG.stream_backoff_factor),
    stream_max_delay_ms: nonNegativeInteger(input?.stream_max_delay_ms, DEFAULT_RETRY_CONFIG.stream_max_delay_ms),
    stream_jitter_percent: percent(input?.stream_jitter_percent, DEFAULT_RETRY_CONFIG.stream_jitter_percent),
    http_max_retries: nonNegativeInteger(input?.http_max_retries, DEFAULT_RETRY_CONFIG.http_max_retries),
    http_initial_delay_ms: nonNegativeInteger(input?.http_initial_delay_ms, DEFAULT_RETRY_CONFIG.http_initial_delay_ms),
    http_backoff_factor: positiveFinite(input?.http_backoff_factor, DEFAULT_RETRY_CONFIG.http_backoff_factor),
    http_max_delay_ms: nonNegativeInteger(input?.http_max_delay_ms, DEFAULT_RETRY_CONFIG.http_max_delay_ms),
    http_jitter_percent: percent(input?.http_jitter_percent, DEFAULT_RETRY_CONFIG.http_jitter_percent),
    respect_retry_after: input?.respect_retry_after ?? DEFAULT_RETRY_CONFIG.respect_retry_after,
    retry_on: input?.retry_on ? [...new Set(input.retry_on)] : DEFAULT_RETRY_ON,
  }
}

function nonNegativeInteger(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback
}

function positiveFinite(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? Math.max(1, value) : fallback
}

function percent(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback
}

function cap(ms: number) {
  return Math.min(Math.max(0, Math.ceil(ms)), RETRY_MAX_DELAY)
}

function header(headers: Record<string, string> | undefined, name: string) {
  if (!headers) return undefined
  const lower = name.toLowerCase()
  return Object.entries(headers).find(([key]) => key.toLowerCase() === lower)?.[1]
}

export function retryAfter(headers: Record<string, string> | undefined, now = Date.now()) {
  const retryAfterMs = header(headers, "retry-after-ms")
  if (retryAfterMs !== undefined) {
    const parsedMs = Number.parseFloat(retryAfterMs)
    if (Number.isFinite(parsedMs) && parsedMs >= 0) return cap(parsedMs)
  }

  const retryAfterSeconds = header(headers, "retry-after")
  if (retryAfterSeconds === undefined) return undefined
  const parsedSeconds = Number.parseFloat(retryAfterSeconds)
  if (Number.isFinite(parsedSeconds) && parsedSeconds >= 0) return cap(parsedSeconds * 1000)

  const parsedDate = Date.parse(retryAfterSeconds) - now
  if (Number.isFinite(parsedDate) && parsedDate > 0) return cap(parsedDate)
  return undefined
}

export function delay(
  layer: RetryLayer,
  attempt: number,
  input?: RetryOptions,
  headers?: Record<string, string>,
  random = Math.random(),
  now = Date.now(),
) {
  const config = resolveConfig(input)
  if (config.respect_retry_after) {
    const serverDelay = retryAfter(headers, now)
    if (serverDelay !== undefined) return serverDelay
  }

  const initial = layer === "stream" ? config.stream_initial_delay_ms : config.http_initial_delay_ms
  const factor = layer === "stream" ? config.stream_backoff_factor : config.http_backoff_factor
  const maximum = layer === "stream" ? config.stream_max_delay_ms : config.http_max_delay_ms
  const jitter = layer === "stream" ? config.stream_jitter_percent : config.http_jitter_percent
  const exponential = initial * factor ** Math.max(0, Math.trunc(attempt) - 1)
  const local = Number.isFinite(exponential) ? Math.min(exponential, maximum) : maximum
  const multiplier = 1 + (Math.min(1, Math.max(0, random)) * 2 - 1) * (jitter / 100)
  return Math.min(Math.max(0, Math.round(local * multiplier)), RETRY_MAX_DELAY)
}

function delayEffect(
  layer: RetryLayer,
  attempt: number,
  input: RetryOptions | undefined,
  headers?: Record<string, string>,
) {
  return Random.next.pipe(Effect.map((random) => delay(layer, attempt, input, headers, random)))
}

export type HttpFailure = {
  category?: RetryCategory
  headers?: Record<string, string>
}

export function classifyHttpError(error: unknown): HttpFailure {
  const apiError = findAPICallError(error)
  if (apiError) {
    const status = apiError.statusCode
    if (hardFailure(apiError.message, apiError.responseBody)) return {}
    if (status === 429) return { category: undefined, headers: apiError.responseHeaders }
    if (status === 403) return { category: "forbidden", headers: apiError.responseHeaders }
    if (status === 408) return { category: "timeout", headers: apiError.responseHeaders }
    if (status !== undefined && status >= 500) return { category: "server", headers: apiError.responseHeaders }
    if (overloadMessage(`${apiError.message}\n${apiError.responseBody ?? ""}`.toLowerCase())) {
      return { category: "server", headers: apiError.responseHeaders }
    }
    return {}
  }
  if (JSONParseError.isInstance(error) || InvalidResponseDataError.isInstance(error)) return { category: "response" }
  if (error instanceof Error && timeoutMessage(error.message.toLowerCase())) return { category: "timeout" }
  if (error instanceof Error && networkMessage(error.message.toLowerCase())) return { category: "network" }
  return {}
}

export function findAPICallError(value: unknown, depth = 0): APICallError | undefined {
  if (APICallError.isInstance(value)) return value
  if (depth > 4 || typeof value !== "object" || value === null) return undefined
  const cause = (value as { cause?: unknown }).cause
  return cause === undefined ? undefined : findAPICallError(cause, depth + 1)
}

export async function retryHttp<A>(input: {
  run: () => PromiseLike<A>
  retry?: RetryOptions
  classify: (error: unknown) => HttpFailure
  signal?: AbortSignal
  random?: () => number
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
}) {
  const config = resolveConfig(input.retry)
  const sleep = input.sleep ?? wait
  for (let attempt = 0; ; attempt++) {
    try {
      return await input.run()
    } catch (error) {
      const failure = input.classify(error)
      if (!failure.category || !config.retry_on.includes(failure.category)) throw error
      if (!httpCategory(failure.category)) throw error
      if (attempt >= config.http_max_retries) throw new HttpRetryError(error, attempt + 1)
      await sleep(delay("http", attempt + 1, config, failure.headers, input.random?.() ?? Math.random()), input.signal)
    }
  }
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

function httpCategory(category: RetryCategory) {
  return (
    category === "network" ||
    category === "timeout" ||
    category === "response" ||
    category === "forbidden" ||
    category === "server"
  )
}

export function classify(error: Err): RetryCategory | undefined {
  if (SessionV1.ContextOverflowError.isInstance(error)) return undefined
  if (SessionV1.StructuredOutputError.isInstance(error)) return "validation"

  if (SessionV1.APIError.isInstance(error)) {
    const status = error.data.statusCode
    const message = error.data.message
    const body = error.data.responseBody
    if (hardFailure(message, body)) return undefined
    if (overloadMessage(`${message}\n${body ?? ""}`.toLowerCase())) return "server"
    if (
      status === 401 ||
      (status !== undefined && status >= 400 && status < 500 && status !== 403 && status !== 408 && status !== 429)
    ) {
      return undefined
    }
    if (status === 403) return "forbidden"
    if (status === 408) return "timeout"
    if (status === 429) return "rate_limit"
    if (status !== undefined && status >= 500) return "server"

    const byCode = categoryFromCode(lower(error.data.metadata?.code))
    if (byCode) return byCode
    if (isHtml(body) || nonJsonResponse(error) || responseParseMessage(message)) return "response"
    return (
      categoryFromMessage(message) ??
      categoryFromJSON(message) ??
      categoryFromJSON(body ?? "") ??
      (error.data.isRetryable ? "network" : undefined)
    )
  }

  const message = isRecord(error.data) && typeof error.data.message === "string" ? error.data.message : undefined
  if (!message || hardFailure(message)) return undefined
  return categoryFromMessage(message) ?? categoryFromJSON(message)
}

function categoryFromCode(code: string) {
  if (!code) return undefined
  if (code.includes("validation") || code.includes("typevalidation") || code.includes("noobject")) return "validation"
  if (code.includes("timeout") || code.includes("timedout")) return "timeout"
  if (code.includes("response") || code.includes("jsonparse") || code.includes("parse") || code.includes("html")) {
    return "response"
  }
  if (networkCode(code)) return "network"
  if (code.includes("rate") || code.includes("throttle") || code.includes("slow_down")) return "rate_limit"
  if (code.includes("overload") || code.includes("server") || code.includes("gateway")) return "server"
}

function categoryFromMessage(message: string) {
  const lowerMessage = message.toLowerCase()
  if (timeoutMessage(lowerMessage)) return "timeout"
  if (rateLimitMessage(lowerMessage)) return "rate_limit"
  if (overloadMessage(lowerMessage)) return "server"
  if (responseParseMessage(lowerMessage)) return "response"
  if (networkMessage(lowerMessage)) return "network"
}

function categoryFromJSON(message: string) {
  const json = parseJSON(message)
  if (!isRecord(json)) return undefined
  const code = typeof json.code === "string" ? json.code.toLowerCase() : ""
  const error = isRecord(json.error) ? json.error : undefined
  const errorCode = typeof error?.code === "string" ? error.code.toLowerCase() : ""
  const errorType = typeof error?.type === "string" ? error.type.toLowerCase() : ""
  if (errorType === "too_many_requests" || errorCode.includes("rate_limit") || errorCode === "slow_down") {
    return "rate_limit"
  }
  if (
    code.includes("exhausted") ||
    code.includes("unavailable") ||
    errorCode.includes("server") ||
    errorCode === "server_is_overloaded"
  ) {
    return "server"
  }
  if (errorCode.includes("validation") || errorType.includes("validation")) return "validation"
}

function networkCode(code: string) {
  return NETWORK_CODES.some((item) => code.includes(item))
}

function networkMessage(message: string) {
  return /\b(fetch failed|network error|connection (?:reset|refused|closed|aborted)|socket|econn|dns)\b/i.test(message)
}

function timeoutMessage(message: string) {
  return /\b(timeout|timed out|timedout|deadline exceeded)\b/i.test(message)
}

function responseParseMessage(message: string) {
  return /(?:unexpected token|unexpected end|invalid json|not valid json|parse (?:the )?response|non[- ]json|html|cloudflare)/i.test(
    message,
  )
}

function rateLimitMessage(message: string) {
  return (
    message.includes("rate increased too quickly") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("slow_down") ||
    message.includes("slow down")
  )
}

function overloadMessage(message: string) {
  return (
    message.includes("overloaded") ||
    message.includes("server_is_overloaded") ||
    message.includes("bad gateway") ||
    message.includes("service unavailable")
  )
}

function hardFailure(message: string, body?: string) {
  const value = `${message}\n${body ?? ""}`.toLowerCase()
  return HARD_FAILURE_PATTERNS.some((pattern) => value.includes(pattern))
}

function isHtml(value: string | undefined) {
  return value !== undefined && /^\s*(?:<!doctype|<html|<head|<body)/i.test(value)
}

function nonJsonResponse(error: SessionV1.APIError) {
  const contentType = header(error.data.responseHeaders, "content-type")?.toLowerCase()
  return (
    error.data.statusCode === 200 &&
    error.data.responseBody !== undefined &&
    contentType !== undefined &&
    !contentType.includes("json")
  )
}

function lower(value: string | undefined) {
  return value?.toLowerCase() ?? ""
}

export function phase(error: Err) {
  return SessionV1.APIError.isInstance(error) ? error.data.metadata?.phase : undefined
}

export function transport(error: Err) {
  return SessionV1.APIError.isInstance(error) ? error.data.metadata?.transport : undefined
}

export function retryable(
  error: Err,
  provider: string,
  language?: Language,
  category?: RetryCategory,
): Retryable | undefined {
  if (SessionV1.ContextOverflowError.isInstance(error)) return undefined
  if (SessionV1.APIError.isInstance(error)) {
    const status = error.data.statusCode
    if (error.data.responseBody?.includes("FreeUsageLimitError")) {
      return {
        message: GO_UPSELL_MESSAGE,
        action: {
          reason: "free_tier_limit",
          provider,
          title: t(language, "session.free_limit"),
          message: t(language, "session.go_upsell_message"),
          label: t(language, "session.subscribe"),
          link: GO_UPSELL_URL,
        },
      }
    }
    if (error.data.responseBody?.includes("GoUsageLimitError")) {
      const body = parseJSON(error.data.responseBody)
      const metadata = field(body, "metadata")
      const workspace = str(field(metadata, "workspace"))
      const limitName = str(field(metadata, "limitName"))
      const retryAfterSeconds = num(header(error.data.responseHeaders, "retry-after"))
      const resetIn = iife(() => {
        if (retryAfterSeconds === undefined) return ""
        const seconds = Math.max(0, Math.ceil(retryAfterSeconds))
        const days = Math.floor(seconds / 86_400)
        const hours = Math.floor((seconds % 86_400) / 3_600)
        const minutes = Math.ceil((seconds % 3_600) / 60)
        const unit = (value: number, name: "day_unit" | "hour_unit" | "minute_unit") =>
          `${value} ${t(language, `session.${name}` as const)}`

        if (days > 0)
          return hours > 0 ? `${unit(days, "day_unit")} ${unit(hours, "hour_unit")}` : unit(days, "day_unit")
        if (hours > 0)
          return minutes > 0 ? `${unit(hours, "hour_unit")} ${unit(minutes, "minute_unit")}` : unit(hours, "hour_unit")
        return minutes > 0 ? unit(minutes, "minute_unit") : t(language, "session.less_than_minute")
      })

      const message = t(language, "session.go_limit_message", {
        limit: limitName ? `${language === "en" ? "" : " "}${limitName} ` : "",
        reset: resetIn,
      })
      const link = `https://opencode.ai/workspace/${workspace}/go`
      return {
        message: `${message} - ${link}`,
        action: {
          reason: "account_rate_limit",
          provider,
          title: t(language, "session.go_limit"),
          message,
          label: t(language, "session.open_settings"),
          link,
        },
      }
    }
    if (hardFailure(error.data.message, error.data.responseBody)) return undefined
    if (status !== undefined && status >= 400 && status < 500 && status !== 403 && status !== 408 && status !== 429) {
      return undefined
    }
    if (
      !error.data.isRetryable &&
      status !== 403 &&
      status !== 408 &&
      status !== 429 &&
      !(status !== undefined && status >= 500) &&
      !overloadMessage(`${error.data.message}\n${error.data.responseBody ?? ""}`.toLowerCase())
    ) {
      if (!category && !classify(error)) return undefined
    }
    return {
      message: overloadMessage(error.data.message.toLowerCase())
        ? t(language, "session.provider_overloaded")
        : error.data.message,
    }
  }

  const message = isRecord(error.data) ? error.data.message : undefined
  const json = parseJSON(message)
  if (isRecord(json)) {
    const jsonError = isRecord(json.error) ? json.error : undefined
    if (json.type === "error" && jsonError?.type === "too_many_requests") {
      return { message: t(language, "session.too_many_requests") }
    }
    const code = typeof json.code === "string" ? json.code : ""
    if (code.includes("exhausted") || code.includes("unavailable")) {
      return { message: t(language, "session.provider_overloaded") }
    }
    if (json.type === "error" && typeof jsonError?.code === "string" && jsonError.code.includes("rate_limit")) {
      return { message: t(language, "session.rate_limited") }
    }
  }
  if (typeof message === "string" && (category ?? classify(error))) return { message }
  return undefined
}

function str(value: unknown) {
  if (value === undefined || value === null) return ""
  return String(value)
}

function field(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined
}

function num(value: unknown) {
  const parsed = Number.parseFloat(str(value))
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

function parseJSON(value: unknown) {
  return iife(() => {
    try {
      if (typeof value !== "string") return undefined
      return JSON.parse(value) as unknown
    } catch {
      return undefined
    }
  })
}

type RetryCallback = (input: { attempt: number; error: Err; category: RetryCategory }) => Effect.Effect<void>

export function policy(opts: {
  provider: string
  language?: Language
  retry?: RetryOptions
  parse: (error: unknown) => Err
  shouldRetry?: (error: Err, category: RetryCategory) => boolean
  onRetry?: RetryCallback
  set: (input: {
    attempt: number
    error: Err
    category: RetryCategory
    message: string
    action?: Retryable["action"]
    next: number
  }) => Effect.Effect<void>
}) {
  const config = resolveConfig(opts.retry)
  return Schedule.fromStepWithMetadata(
    Effect.succeed((meta: Schedule.InputMetadata<unknown>) => {
      const error = opts.parse(meta.input)
      const category = classify(error)
      if (
        !category ||
        phase(error) === "http" ||
        !config.retry_on.includes(category) ||
        meta.attempt > config.stream_max_retries
      ) {
        return Cause.done(meta.attempt)
      }
      if (opts.shouldRetry && !opts.shouldRetry(error, category)) return Cause.done(meta.attempt)
      const retry = retryable(error, opts.provider, opts.language, category)
      if (!retry) return Cause.done(meta.attempt)
      return Effect.gen(function* () {
        const wait = yield* delayEffect(
          "stream",
          meta.attempt,
          config,
          SessionV1.APIError.isInstance(error) ? error.data.responseHeaders : undefined,
        )
        const now = yield* Clock.currentTimeMillis
        yield* opts.set({
          attempt: meta.attempt,
          error,
          category,
          message: retry.message,
          action: retry.action,
          next: now + wait,
        })
        if (opts.onRetry) yield* opts.onRetry({ attempt: meta.attempt, error, category })
        return [meta.attempt, Duration.millis(wait)] as [number, Duration.Duration]
      })
    }),
  )
}

export * as SessionRetry from "./retry"
