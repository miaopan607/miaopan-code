import type { Auth } from "@/auth"
import type { Provider } from "@/provider/provider"
import { ProviderTransform } from "@/provider/transform"
import { errorMessage } from "@/util/error"
import { isRecord } from "@/util/record"
import { asSchema, type ModelMessage, type Tool } from "ai"
import { Cause, Effect, FiberSet, Queue } from "effect"
import * as Stream from "effect/Stream"
import { FetchHttpClient } from "effect/unstable/http"
import {
  HttpRetryOptions,
  LLMRequest,
  Tool as NativeTool,
  ToolFailure,
  ToolRuntime,
  toDefinitions,
  type JsonSchema,
  type LLMEvent,
} from "@miaopan-code/llm"
import type { LLMClientShape } from "@miaopan-code/llm/route"
import { LLMNative } from "./native-request"
import { t, type Language } from "@miaopan-code/core/i18n"
import { SessionRetry } from "../retry"

export type RuntimeStatus =
  | { readonly type: "supported"; readonly apiKey: string; readonly baseURL?: string }
  | { readonly type: "unsupported"; readonly reason: string }
export type StreamResult =
  | { readonly type: "supported"; readonly stream: Stream.Stream<LLMEvent, unknown> }
  | { readonly type: "unsupported"; readonly reason: string }

type StreamInput = {
  readonly model: Provider.Model
  readonly provider: Provider.Info
  readonly auth: Auth.Info | undefined
  readonly llmClient: LLMClientShape
  readonly messages: ModelMessage[]
  readonly tools: Record<string, Tool>
  readonly toolChoice?: "auto" | "required" | "none"
  readonly temperature?: number
  readonly topP?: number
  readonly topK?: number
  readonly maxOutputTokens?: number
  readonly providerOptions?: Record<string, any>
  readonly headers: Record<string, string>
  readonly retry?: SessionRetry.RetryOptions
  readonly abort: AbortSignal
  readonly language?: Language
}

export function status(input: Pick<StreamInput, "model" | "provider" | "auth" | "language">): RuntimeStatus {
  return statusWithFetch(input, providerFetch(input))
}

function statusWithFetch(
  input: Pick<StreamInput, "model" | "provider" | "auth" | "language">,
  fetch: typeof globalThis.fetch | undefined,
): RuntimeStatus {
  const providerID = input.model.providerID
  if (providerID !== "openai" && providerID !== "anthropic" && !providerID.startsWith("opencode"))
    return { type: "unsupported", reason: t(input.language, "error.native_provider_unsupported") }
  const npm = input.model.api.npm
  if (npm !== "@ai-sdk/openai" && npm !== "@ai-sdk/openai-compatible" && npm !== "@ai-sdk/anthropic")
    return { type: "unsupported", reason: t(input.language, "error.native_package_unsupported") }
  if (input.auth?.type === "oauth" && !(input.provider.id === "openai" && fetch)) {
    return { type: "unsupported", reason: t(input.language, "error.native_oauth_fetch_required") }
  }

  const apiKey = typeof input.provider.options.apiKey === "string" ? input.provider.options.apiKey : input.provider.key
  if (!apiKey) return { type: "unsupported", reason: t(input.language, "error.native_api_key_missing") }

  return {
    type: "supported",
    apiKey,
    baseURL: typeof input.provider.options.baseURL === "string" ? input.provider.options.baseURL : undefined,
  }
}

export function stream(input: StreamInput): StreamResult {
  const fetch = providerFetch(input)
  const current = statusWithFetch(input, fetch)
  if (current.type === "unsupported") return current

  // Integration point with @miaopan-code/llm: native-request lowers session data
  // into an LLMRequest, then LLMClient handles route selection and transport.
  //
  // ProviderTransform.providerOptions builds AI-SDK-shaped options for the
  // selected SDK key (e.g. "openai") and the native LLM SDK reads the same
  // keys via OpenAIOptions.* (store, reasoningEffort, reasoningSummary,
  // include, textVerbosity, promptCacheKey). Both sides intentionally use
  // OpenAI's official wire field names, so this is identity, not translation
  // — if a field ever needs to differ between the two surfaces, the
  // translation belongs here, not split across both packages.
  const tools = nativeTools(input.tools, input)
  const request = LLMNative.request({
    model: input.model,
    apiKey: current.apiKey,
    baseURL: current.baseURL,
    messages: ProviderTransform.message(input.messages, input.model, input.providerOptions ?? {}, input.language),
    toolChoice: input.toolChoice,
    temperature: input.temperature,
    topP: input.topP,
    topK: input.topK,
    maxOutputTokens: input.maxOutputTokens,
    providerOptions: ProviderTransform.providerOptions(input.model, input.providerOptions ?? {}),
    headers: { ...providerHeaders(input.provider.options.headers), ...input.headers },
    retry: nativeRetry(input.retry),
    language: input.language,
  })
  const stream = Stream.scoped(
    Stream.unwrap(
      Effect.gen(function* () {
        const settlements = yield* FiberSet.make<void>()
        const results = yield* Queue.unbounded<LLMEvent, Cause.Done>()
        const provider = input.llmClient
          .stream(
            LLMRequest.update(request, {
              tools: [...request.tools, ...toDefinitions(tools)],
            }),
          )
          .pipe(
            Stream.flatMap((event) =>
              event.type !== "tool-call" || event.providerExecuted
                ? Stream.make(event)
                : Stream.make(event).pipe(
                    Stream.concat(
                      Stream.fromEffectDrain(
                        ToolRuntime.dispatch(tools, event, input.language).pipe(
                          Effect.flatMap((dispatched) => Queue.offerAll(results, dispatched.events)),
                          Effect.catchCause((cause) => Queue.failCause(results, cause)),
                          Effect.asVoid,
                          FiberSet.run(settlements, { startImmediately: true }),
                        ),
                      ),
                    ),
                  ),
            ),
            Stream.concat(
              Stream.fromEffectDrain(
                FiberSet.awaitEmpty(settlements).pipe(Effect.andThen(Queue.end(results)), Effect.asVoid),
              ),
            ),
          )
        return provider.pipe(Stream.concat(Stream.fromQueue(results)))
      }),
    ),
  )

  return {
    ...current,
    stream: fetch ? stream.pipe(Stream.provideService(FetchHttpClient.Fetch, fetch)) : stream,
  }
}

function nativeRetry(input: SessionRetry.RetryOptions | undefined) {
  const retry = SessionRetry.resolveConfig(input)
  return new HttpRetryOptions({
    maxRetries: retry.http_max_retries,
    initialDelayMs: retry.http_initial_delay_ms,
    backoffFactor: retry.http_backoff_factor,
    maxDelayMs: retry.http_max_delay_ms,
    jitterPercent: retry.http_jitter_percent,
    respectRetryAfter: retry.respect_retry_after,
    retryOn: [...retry.retry_on],
  })
}

function providerFetch(input: Pick<StreamInput, "provider" | "auth">): typeof globalThis.fetch | undefined {
  if (input.provider.id !== "openai" || input.auth?.type !== "oauth") return undefined
  const value: unknown = input.provider.options.fetch
  if (typeof value !== "function") return undefined
  return value as typeof globalThis.fetch
}

function providerHeaders(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
}

function nativeSchema(value: unknown): JsonSchema {
  if (!value || typeof value !== "object") return { type: "object", properties: {} }
  if ("jsonSchema" in value && value.jsonSchema && typeof value.jsonSchema === "object")
    return value.jsonSchema as JsonSchema
  return asSchema(value as Parameters<typeof asSchema>[0]).jsonSchema as JsonSchema
}

export function nativeTools(tools: Record<string, Tool>, input: Pick<StreamInput, "messages" | "abort" | "language">) {
  return Object.fromEntries(
    Object.entries(tools).map(([name, item]) => [
      name,
      // Tool execution remains miaopanCode-owned. The native runtime only adapts
      // the @miaopan-code/llm tool call back into the AI SDK Tool.execute shape.
      NativeTool.make({
        description: item.description ?? "",
        jsonSchema: nativeSchema(item.inputSchema),
        execute: (args: unknown, ctx) =>
          Effect.tryPromise({
            try: () => {
              if (!item.execute) throw new Error(t(input.language, "error.native_tool_execute_missing", { name }))
              return item.execute(args, {
                toolCallId: ctx?.id ?? name,
                messages: input.messages,
                abortSignal: input.abort,
              })
            },
            catch: (error) => new ToolFailure({ message: errorMessage(error), error }),
          }),
      }),
    ]),
  )
}

export * as LLMNativeRuntime from "./native-runtime"
