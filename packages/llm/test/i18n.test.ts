import { describe, expect, test } from "bun:test"
import { Auth, I18n, LLM, LLMClient, LLMEvent, Message, ToolRuntime } from "../src/index"
import { Effect } from "effect"
import * as OpenAIChat from "../src/protocols/openai-chat"

describe("LLM i18n", () => {
  test("every key has Simplified Chinese and English values", () => {
    for (const [key, value] of Object.entries(I18n.messages)) {
      expect(value["zh-CN"].trim(), `${key} zh-CN`).not.toBe("")
      expect(value.en.trim(), `${key} en`).not.toBe("")
    }
  })

  test("every translation uses the same interpolation parameters", () => {
    const parameters = (value: string) => [...value.matchAll(/{{(\w+)}}/g)].map((match) => match[1]).sort()
    for (const [key, value] of Object.entries(I18n.messages)) {
      expect(parameters(value["zh-CN"]), `${key} parameters`).toEqual(parameters(value.en))
    }
  })

  test("tool dispatch defaults to Chinese and supports English", async () => {
    const call = LLMEvent.toolCall({ id: "call_1", name: "missing", input: {} })
    const chinese = await Effect.runPromise(ToolRuntime.dispatch({}, call))
    const english = await Effect.runPromise(ToolRuntime.dispatch({}, call, "en"))
    expect(chinese.result).toEqual({ type: "error", value: "未知工具：missing" })
    expect(english.result).toEqual({ type: "error", value: "Unknown tool: missing" })
  })

  test("request language reaches protocol validation errors", async () => {
    const model = OpenAIChat.route
      .with({ endpoint: { baseURL: "https://api.openai.test/v1" }, auth: Auth.bearer("test") })
      .model({ id: "gpt-4o-mini" })
    const prepareError = (language?: "zh-CN" | "en") =>
      LLMClient.prepare(
        LLM.request({
          model,
          language,
          messages: [Message.user({ type: "media", mediaType: "image/svg+xml", data: "PHN2Zz4=" })],
        }),
      ).pipe(Effect.flip, Effect.runPromise)

    const [chinese, english] = await Promise.all([prepareError(), prepareError("en")])
    expect(chinese.message).toContain("OpenAI Chat 不支持媒体类型 image/svg+xml")
    expect(english.message).toContain("OpenAI Chat does not support media type image/svg+xml")
  })
})
