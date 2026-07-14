import { describe, expect, test } from "bun:test"
import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { SessionV1 } from "@miaopan-code/core/v1/session"
import type { NamedError } from "@miaopan-code/core/util/error"
import { APICallError, JSONParseError, NoObjectGeneratedError, TypeValidationError } from "ai"
import { setTimeout as sleep } from "node:timers/promises"
import { Cause, Effect, Exit, Schedule, Schema } from "effect"
import { CrossSpawnSpawner } from "@miaopan-code/core/cross-spawn-spawner"
import { SessionRetry } from "../../src/session/retry"
import { MessageV2 } from "../../src/session/message-v2"
import { ProviderError } from "../../src/provider/error"
import { SessionID } from "../../src/session/schema"
import { SessionStatus } from "../../src/session/status"
import { testEffect } from "../lib/effect"
import { ProviderV2 } from "@miaopan-code/core/provider"

const providerID = ProviderV2.ID.make("test")
const retryProvider = "test"
const it = testEffect(LayerNode.compile(LayerNode.group([SessionStatus.node, CrossSpawnSpawner.node])))

function apiError(headers?: Record<string, string>): SessionV1.APIError {
  return Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
    new SessionV1.APIError({
      message: "boom",
      isRetryable: true,
      responseHeaders: headers,
    }).toObject(),
  )
}

function statusError(statusCode: number, isRetryable = false, responseBody?: string): SessionV1.APIError {
  return Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
    new SessionV1.APIError({ message: `HTTP ${statusCode}`, statusCode, isRetryable, responseBody }).toObject(),
  )
}

function wrap(message: unknown): ReturnType<NamedError["toObject"]> {
  return { name: "", data: { message } }
}

describe("session.retry.delay", () => {
  test("uses independent stream and HTTP defaults", () => {
    expect(
      Array.from({ length: 6 }, (_, index) => SessionRetry.delay("stream", index + 1, undefined, undefined, 0.5)),
    ).toEqual([200, 400, 800, 1600, 3200, 3200])
    expect(
      Array.from({ length: 6 }, (_, index) => SessionRetry.delay("http", index + 1, undefined, undefined, 0.5)),
    ).toEqual([200, 400, 800, 1600, 1600, 1600])
  })

  test("retry-after-ms overrides local backoff", () => {
    expect(SessionRetry.delay("stream", 4, undefined, { "retry-after-ms": "1500" }, 0)).toBe(1500)
  })

  test("uses retry-after seconds", () => {
    expect(SessionRetry.delay("stream", 3, undefined, { "retry-after": "30" }, 0)).toBe(30000)
  })

  test("accepts http-date retry-after values", () => {
    const date = new Date(Date.now() + 20000).toUTCString()
    const d = SessionRetry.delay("stream", 1, undefined, { "retry-after": date }, 0.5)
    expect(d).toBeGreaterThanOrEqual(19000)
    expect(d).toBeLessThanOrEqual(20000)
  })

  test("ignores invalid retry hints", () => {
    expect(SessionRetry.delay("stream", 1, undefined, { "retry-after": "not-a-number" }, 0.5)).toBe(200)
  })

  test("ignores malformed date retry hints", () => {
    expect(SessionRetry.delay("stream", 1, undefined, { "retry-after": "Invalid Date String" }, 0.5)).toBe(200)
  })

  test("ignores past date retry hints", () => {
    const pastDate = new Date(Date.now() - 5000).toUTCString()
    expect(SessionRetry.delay("stream", 1, undefined, { "retry-after": pastDate }, 0.5)).toBe(200)
  })

  test("uses retry-after values above the local maximum", () => {
    expect(SessionRetry.delay("http", 1, undefined, { "retry-after": "50" }, 0.5)).toBe(50000)
    expect(SessionRetry.delay("http", 1, undefined, { "retry-after-ms": "700000" }, 0.5)).toBe(700000)
  })

  test("caps oversized header delays to the runtime timer limit", () => {
    expect(SessionRetry.delay("http", 1, undefined, { "retry-after-ms": "999999999999" }, 0.5)).toBe(
      SessionRetry.RETRY_MAX_DELAY,
    )
  })

  test("applies uniform configurable jitter", () => {
    const retry = { stream_initial_delay_ms: 100, stream_jitter_percent: 10 }
    expect(SessionRetry.delay("stream", 1, retry, undefined, 0)).toBe(90)
    expect(SessionRetry.delay("stream", 1, retry, undefined, 0.5)).toBe(100)
    expect(SessionRetry.delay("stream", 1, retry, undefined, 1)).toBe(110)
  })

  it.instance("policy updates retry status and increments attempts", () =>
    Effect.gen(function* () {
      const sessionID = SessionID.make("session-retry-test")
      const error = apiError({ "retry-after-ms": "0" })
      const status = yield* SessionStatus.Service

      const step = yield* Schedule.toStepWithMetadata(
        SessionRetry.policy({
          provider: "test",
          parse: Schema.decodeUnknownSync(SessionV1.APIError.Schema),
          set: (info) =>
            status.set(sessionID, {
              type: "retry",
              attempt: info.attempt,
              message: info.message,
              next: info.next,
            }),
        }),
      )
      yield* step(error)
      yield* step(error)

      expect(yield* status.get(sessionID)).toMatchObject({
        type: "retry",
        attempt: 2,
        message: "boom",
      })
    }),
  )

  it.instance("policy preserves the original failure when retry is disabled", () =>
    Effect.gen(function* () {
      const error = apiError({ "retry-after-ms": "0" })
      let runs = 0
      let sets = 0
      const exit = yield* Effect.exit(
        Effect.sync(() => {
          runs += 1
        }).pipe(
          Effect.flatMap(() => Effect.fail(error)),
          Effect.retry(
            SessionRetry.policy({
              provider: retryProvider,
              parse: Schema.decodeUnknownSync(SessionV1.APIError.Schema),
              shouldRetry: () => false,
              set: () =>
                Effect.sync(() => {
                  sets += 1
                }),
            }),
          ),
        ),
      )

      expect(runs).toBe(1)
      expect(sets).toBe(0)
      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) expect(Cause.squash(exit.cause)).toBe(error)
    }),
  )
})

describe("session.retry.configuration", () => {
  test("uses five stream retries by default", async () => {
    let runs = 0
    const error = statusError(500)
    const exit = await Effect.runPromise(
      Effect.exit(
        Effect.sync(() => {
          runs++
        }).pipe(
          Effect.flatMap(() => Effect.fail(error)),
          Effect.retry(
            SessionRetry.policy({
              provider: retryProvider,
              parse: Schema.decodeUnknownSync(SessionV1.APIError.Schema),
              retry: {
                stream_initial_delay_ms: 0,
                stream_max_delay_ms: 0,
                respect_retry_after: false,
              },
              set: () => Effect.void,
            }),
          ),
        ),
      ),
    )

    expect(runs).toBe(6)
    expect(Exit.isFailure(exit)).toBe(true)
  })

  test("stream_max_retries zero disables automatic retry", async () => {
    let runs = 0
    const error = statusError(500)
    await Effect.runPromise(
      Effect.exit(
        Effect.sync(() => {
          runs++
        }).pipe(
          Effect.flatMap(() => Effect.fail(error)),
          Effect.retry(
            SessionRetry.policy({
              provider: retryProvider,
              parse: Schema.decodeUnknownSync(SessionV1.APIError.Schema),
              retry: { stream_max_retries: 0, stream_initial_delay_ms: 0, stream_max_delay_ms: 0 },
              set: () => Effect.void,
            }),
          ),
        ),
      ),
    )

    expect(runs).toBe(1)
  })

  test("classifies default HTTP retry categories and hard failures", () => {
    expect(SessionRetry.classify(statusError(403))).toBe("forbidden")
    expect(SessionRetry.classify(statusError(429))).toBe("rate_limit")
    expect(SessionRetry.classify(statusError(500))).toBe("server")
    expect(SessionRetry.classify(statusError(502))).toBe("server")
    expect(SessionRetry.classify(statusError(503))).toBe("server")
    expect(SessionRetry.classify(statusError(504))).toBe("server")
    expect(SessionRetry.classify(statusError(401))).toBeUndefined()
    expect(SessionRetry.classify(statusError(400))).toBeUndefined()
    expect(SessionRetry.classify(statusError(422))).toBeUndefined()
  })

  test("retry_on can disable a retry category", () => {
    const error = statusError(403)
    expect(SessionRetry.resolveConfig({ retry_on: ["server"] }).retry_on).toEqual(["server"])
    expect(SessionRetry.classify(error)).toBe("forbidden")
  })

  test("uses configured local backoff parameters", () => {
    const config = {
      stream_initial_delay_ms: 10,
      stream_backoff_factor: 3,
      stream_max_delay_ms: 50,
      stream_jitter_percent: 0,
      respect_retry_after: false,
    }
    expect(SessionRetry.delay("stream", 1, config, { "retry-after-ms": "1" })).toBe(10)
    expect(SessionRetry.delay("stream", 2, config)).toBe(30)
    expect(SessionRetry.delay("stream", 3, config)).toBe(50)
  })

  test("respects or ignores provider retry intervals according to configuration", () => {
    const headers = { "retry-after-ms": "100" }
    expect(
      SessionRetry.delay(
        "stream",
        1,
        { stream_initial_delay_ms: 10, stream_jitter_percent: 0, respect_retry_after: true },
        headers,
      ),
    ).toBe(100)
    expect(
      SessionRetry.delay(
        "stream",
        1,
        { stream_initial_delay_ms: 10, stream_jitter_percent: 0, respect_retry_after: false },
        headers,
      ),
    ).toBe(10)
  })
})

describe("session.retry.retryable", () => {
  test("maps too_many_requests json messages", () => {
    const error = wrap(JSON.stringify({ type: "error", error: { type: "too_many_requests" } }))
    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: "请求过多" })
    expect(SessionRetry.retryable(error, retryProvider, "en")).toEqual({ message: "Too Many Requests" })
  })

  test("maps overloaded provider codes", () => {
    const error = wrap(JSON.stringify({ code: "resource_exhausted" }))
    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: "提供商过载" })
  })

  test("does not retry unknown json messages", () => {
    const error = wrap(JSON.stringify({ error: { message: "no_kv_space" } }))
    expect(SessionRetry.retryable(error, retryProvider)).toBeUndefined()
  })

  test("does not throw on numeric error codes", () => {
    const error = wrap(JSON.stringify({ type: "error", error: { code: 123 } }))
    const result = SessionRetry.retryable(error, retryProvider)
    expect(result).toBeUndefined()
  })

  test("returns undefined for non-json message", () => {
    const error = wrap("not-json")
    expect(SessionRetry.retryable(error, retryProvider)).toBeUndefined()
  })

  test("retries plain text rate limit errors from Alibaba", () => {
    const msg =
      "Upstream error from Alibaba: Request rate increased too quickly. To ensure system stability, please adjust your client logic to scale requests more smoothly over time."
    const error = wrap(msg)
    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: msg })
  })

  test("retries plain text rate limit errors", () => {
    const msg = "Rate limit exceeded, please try again later"
    const error = wrap(msg)
    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: msg })
  })

  test("retries too many requests in plain text", () => {
    const msg = "Too many requests, please slow down"
    const error = wrap(msg)
    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: msg })
  })

  test("retries transport timeout errors", () => {
    const request = MessageV2.fromError(new ProviderError.HeaderTimeoutError(10000), { providerID })
    expect(SessionV1.APIError.isInstance(request)).toBe(true)
    expect(SessionRetry.retryable(request, retryProvider)).toEqual({
      message: "提供商响应标头在 10000 毫秒后超时",
    })
  })

  test("retries websocket stream transport errors", () => {
    const request = MessageV2.fromError(
      new ProviderError.ResponseStreamError("WebSocket closed before response.completed (code 1006: Connection ended)"),
      { providerID },
    )
    expect(SessionV1.APIError.isInstance(request)).toBe(true)
    expect(SessionRetry.retryable(request, retryProvider)).toEqual({
      message: "WebSocket closed before response.completed (code 1006: Connection ended)",
    })
  })

  test("does not retry context overflow errors", () => {
    const error = new SessionV1.ContextOverflowError({
      message: "Input exceeds context window of this model",
      responseBody: '{"error":{"code":"context_length_exceeded"}}',
    }).toObject()

    expect(SessionRetry.retryable(error, retryProvider)).toBeUndefined()
  })

  test("retries 500 errors even when isRetryable is false", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Internal server error",
        isRetryable: false,
        statusCode: 500,
        responseBody: '{"type":"api_error","message":"Internal server error"}',
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: "Internal server error" })
  })

  test("retries 502 bad gateway errors", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Bad gateway",
        isRetryable: false,
        statusCode: 502,
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: "提供商过载" })
  })

  test("retries 503 service unavailable errors", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Service unavailable",
        isRetryable: false,
        statusCode: 503,
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, retryProvider)).toEqual({ message: "提供商过载" })
  })

  test("does not retry 4xx errors when isRetryable is false", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Bad request",
        isRetryable: false,
        statusCode: 400,
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, retryProvider)).toBeUndefined()
  })

  test("retries ZlibError decompression failures", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Response decompression failed",
        isRetryable: true,
        metadata: { code: "ZlibError" },
      }).toObject(),
    )

    const retryable = SessionRetry.retryable(error, retryProvider)
    expect(retryable).toBeDefined()
    expect(retryable).toEqual({ message: "Response decompression failed" })
  })

  test("maps free limits to Go upsell action", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Free usage exceeded",
        isRetryable: true,
        statusCode: 429,
        responseBody: JSON.stringify({
          type: "error",
          error: { type: "FreeUsageLimitError", message: "Free usage exceeded" },
        }),
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, "opencode")).toEqual({
      message: SessionRetry.GO_UPSELL_MESSAGE,
      action: {
        reason: "free_tier_limit",
        provider: "opencode",
        title: "已达到免费额度",
        message: "订阅 OpenCode Go 即可稳定访问优秀的开源模型，起价为每月 5 美元。",
        label: "订阅",
        link: SessionRetry.GO_UPSELL_URL,
      },
    })
  })

  test("maps Go subscription limits to workspace PAYG upsell", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Subscription quota exceeded. You can continue using free models.",
        isRetryable: true,
        statusCode: 429,
        responseHeaders: {
          "retry-after": "19380",
        },
        responseBody: JSON.stringify({
          type: "error",
          error: {
            type: "GoUsageLimitError",
            message: "Subscription quota exceeded. You can continue using free models.",
          },
          metadata: {
            workspace: "wrk_01K6XGM22R6FM8JVABE9XDQXGH",
            limitName: "5 hour",
          },
        }),
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, "opencode-go")).toEqual({
      message:
        "已达到 5 hour 用量限制，将在 5 小时 23 分钟后重置。若要立即继续使用此模型，请启用可用余额中的用量 - https://opencode.ai/workspace/wrk_01K6XGM22R6FM8JVABE9XDQXGH/go",
      action: {
        reason: "account_rate_limit",
        provider: "opencode-go",
        title: "已达到 Go 额度",
        message: "已达到 5 hour 用量限制，将在 5 小时 23 分钟后重置。若要立即继续使用此模型，请启用可用余额中的用量",
        label: "打开设置",
        link: "https://opencode.ai/workspace/wrk_01K6XGM22R6FM8JVABE9XDQXGH/go",
      },
    })
  })

  test("maps Go subscription limits without limit metadata", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Subscription quota exceeded. You can continue using free models.",
        isRetryable: true,
        statusCode: 429,
        responseHeaders: {
          "retry-after": "900",
        },
        responseBody: JSON.stringify({
          type: "error",
          error: {
            type: "GoUsageLimitError",
            message: "Subscription quota exceeded. You can continue using free models.",
          },
          metadata: {
            workspace: "wrk_01K6XGM22R6FM8JVABE9XDQXGH",
          },
        }),
      }).toObject(),
    )

    expect(SessionRetry.retryable(error, "opencode-go")?.action?.message).toBe(
      "已达到用量限制，将在 15 分钟后重置。若要立即继续使用此模型，请启用可用余额中的用量",
    )
  })
})

describe("session.message-v2.fromError", () => {
  test("converts structured output validation errors with original details", () => {
    const error = new NoObjectGeneratedError({
      message: "No object generated: response did not match schema.",
      cause: new TypeValidationError({ value: { answer: "four" }, cause: "expected a number" }),
      text: '{"answer":"four"}',
      response: undefined as never,
      usage: undefined as never,
      finishReason: undefined as never,
    })
    const result = MessageV2.fromError(error, { providerID })

    expect(SessionV1.APIError.isInstance(result)).toBe(true)
    if (!SessionV1.APIError.isInstance(result)) return
    expect(result.data.isRetryable).toBe(true)
    expect(result.data.message).toContain("No object generated")
    expect(result.data.message).toContain("expected a number")
    expect(result.data.responseBody).toBe('{"answer":"four"}')
    expect(SessionRetry.classify(result)).toBe("validation")
  })

  test("classifies JSON parse and HTML response failures", () => {
    const parsed = MessageV2.fromError(new JSONParseError({ text: "<html>Cloudflare</html>", cause: new Error("<") }), {
      providerID,
    })
    expect(SessionV1.APIError.isInstance(parsed)).toBe(true)
    expect(SessionRetry.classify(parsed)).toBe("response")

    const html = MessageV2.fromError(
      new APICallError({
        message: "OK",
        url: "https://provider.example/v1",
        requestBodyValues: {},
        statusCode: 403,
        responseHeaders: { "content-type": "text/html" },
        responseBody: "<!doctype html><title>Cloudflare</title>",
        isRetryable: false,
      }),
      { providerID },
    )
    expect(SessionRetry.classify(html)).toBe("forbidden")
  })

  test("keeps hard quota and content policy failures non-retryable", () => {
    const quota = new SessionV1.APIError({
      message: "insufficient_quota",
      statusCode: 429,
      isRetryable: true,
    }).toObject()
    const safety = new SessionV1.APIError({
      message: "Content policy rejected the request",
      statusCode: 403,
      isRetryable: false,
    }).toObject()
    const subscription = new SessionV1.APIError({
      message: "The requested model is not supported by your subscription",
      statusCode: 429,
      isRetryable: true,
    }).toObject()
    expect(SessionRetry.classify(quota)).toBeUndefined()
    expect(SessionRetry.classify(safety)).toBeUndefined()
    expect(SessionRetry.classify(subscription)).toBeUndefined()
  })

  test.concurrent(
    "converts ECONNRESET socket errors to retryable APIError",
    async () => {
      using server = Bun.serve({
        port: 0,
        idleTimeout: 8,
        async fetch(_req) {
          return new Response(
            new ReadableStream({
              async pull(controller) {
                controller.enqueue("Hello,")
                await sleep(10000)
                controller.enqueue(" World!")
                controller.close()
              },
            }),
            { headers: { "Content-Type": "text/plain" } },
          )
        },
      })

      const error = await fetch(new URL("/", server.url.origin))
        .then((res) => res.text())
        .catch((e) => e)

      const result = MessageV2.fromError(error, { providerID })

      expect(SessionV1.APIError.isInstance(result)).toBe(true)
      if (!SessionV1.APIError.isInstance(result)) throw new Error("expected APIError")
      expect(result.data.isRetryable).toBe(true)
      expect(result.data.message).toBe("服务器重置了连接")
      expect(result.data.metadata?.code).toBe("ECONNRESET")
      expect(result.data.metadata?.message).toInclude("socket connection")
    },
    15_000,
  )

  test("ECONNRESET socket error is retryable", () => {
    const error = Schema.decodeUnknownSync(SessionV1.APIError.Schema)(
      new SessionV1.APIError({
        message: "Connection reset by server",
        isRetryable: true,
        metadata: { code: "ECONNRESET", message: "The socket connection was closed unexpectedly" },
      }).toObject(),
    )

    const retryable = SessionRetry.retryable(error, retryProvider)
    expect(retryable).toBeDefined()
    expect(retryable).toEqual({ message: "Connection reset by server" })
  })

  test("marks OpenAI 404 status codes as retryable", () => {
    const error = new APICallError({
      message: "boom",
      url: "https://api.openai.com/v1/chat/completions",
      requestBodyValues: {},
      statusCode: 404,
      responseHeaders: { "content-type": "application/json" },
      responseBody: '{"error":"boom"}',
      isRetryable: false,
    })
    const result = MessageV2.fromError(error, { providerID: ProviderV2.ID.make("openai") })
    if (!SessionV1.APIError.isInstance(result)) throw new Error("expected APIError")
    expect(result.data.isRetryable).toBe(true)
  })

  test("converts OpenAI server_error stream chunks to retryable APIError", () => {
    const result = MessageV2.fromError(
      {
        message: JSON.stringify({
          type: "error",
          sequence_number: 2,
          error: {
            type: "server_error",
            code: "server_error",
            message: "An error occurred while processing your request.",
            param: null,
          },
        }),
      },
      { providerID: ProviderV2.ID.make("openai") },
    )

    expect(SessionV1.APIError.isInstance(result)).toBe(true)
    if (!SessionV1.APIError.isInstance(result)) throw new Error("expected APIError")
    expect(result.data.isRetryable).toBe(true)
    expect(SessionRetry.retryable(result, retryProvider)).toEqual({
      message: "An error occurred while processing your request.",
    })
  })
})
