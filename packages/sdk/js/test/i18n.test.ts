import { describe, expect, test } from "bun:test"
import { createMiaopanCodeClient as createV2Client, MiaopanCodeClient as V2Client } from "../src/v2/client"
import { createSseClient } from "../src/v2/gen/core/serverSentEvents.gen"
import { resolveLanguage, t } from "../src/i18n"

describe("SDK i18n", () => {
  test("defaults to Simplified Chinese", () => {
    expect(resolveLanguage(undefined)).toBe("zh-CN")
    expect(resolveLanguage("fr")).toBe("zh-CN")
    expect(t(undefined, "client_network_no_response")).toBe("网络错误（无响应）")
  })

  test("supports English and parameters", () => {
    expect(resolveLanguage("en")).toBe("en")
    expect(t("en", "server_timeout", { timeout: 5000 })).toBe("Timeout waiting for server to start after 5000ms")
  })

  test.each([
    [undefined, "不支持深层嵌套的数组/对象。请提供自定义 `querySerializer()` 处理这些值。"],
    ["en", "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."],
  ] as const)("uses the client language for generated query errors", async (language, message) => {
    const client = createV2Client({
      language,
      fetch: async () => new Response("{}", { headers: { "content-type": "application/json" } }),
    })

    await expect(client.experimental.session.list({ directory: { nested: { value: true } } as never })).rejects.toThrow(
      message,
    )
  })

  test.each([
    [undefined, "SSE 请求失败：503 Service Unavailable"],
    ["en", "SSE failed: 503 Service Unavailable"],
  ] as const)("uses the client language for generated SSE errors", async (language, message) => {
    const errors: unknown[] = []
    const result = createSseClient({
      fetch: async () => new Response(null, { status: 503, statusText: "Service Unavailable" }),
      language,
      onSseError: (error) => errors.push(error),
      sseMaxRetryAttempts: 1,
      url: "http://localhost/events",
    })

    await result.stream.next()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toBeInstanceOf(Error)
    expect((errors[0] as Error).message).toBe(message)
  })

  test("uses the client language for generated registry errors", () => {
    createV2Client({ language: "en" })
    expect(() => V2Client.__registry.get("missing-english-client")).toThrow(
      'No SDK client found. Create one with "new MiaopanCodeClient()" to fix this error.',
    )
  })
})
