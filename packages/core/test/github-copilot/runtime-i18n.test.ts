import { describe, expect, test } from "bun:test"
import { prepareTools } from "@miaopan-code/core/github-copilot/chat/openai-compatible-prepare-tools"
import { prepareResponsesTools } from "@miaopan-code/core/github-copilot/responses/openai-responses-prepare-tools"
import { Fff } from "@miaopan-code/core/filesystem/fff.node"

describe("GitHub Copilot runtime i18n", () => {
  test("defaults generated tool warnings to Chinese", () => {
    const result = prepareTools({
      tools: [{ type: "provider", id: "custom.tool", name: "custom", args: {} }],
      toolChoice: undefined,
    })

    expect(result.toolWarnings).toEqual([{ type: "unsupported", feature: "工具类型：provider" }])
  })

  test("supports English generated tool warnings", () => {
    const result = prepareTools({
      tools: [{ type: "provider", id: "custom.tool", name: "custom", args: {} }],
      toolChoice: undefined,
      language: "en",
    })

    expect(result.toolWarnings).toEqual([{ type: "unsupported", feature: "tool type: provider" }])
  })

  test("localizes Responses unsupported tool warnings", () => {
    const tools = [{ type: "unsupported" }] as never
    expect(prepareResponsesTools({ tools, strictJsonSchema: false }).toolWarnings).toEqual([
      { type: "unsupported", feature: "工具类型" },
    ])
    expect(prepareResponsesTools({ tools, strictJsonSchema: false, language: "en" }).toolWarnings).toEqual([
      { type: "unsupported", feature: "tool type" },
    ])
  })

  test("localizes the Node fff fallback", () => {
    expect(Fff.create({ basePath: "/tmp" })).toEqual({ ok: false, error: "fff 在 Node 运行时不可用" })
    expect(Fff.create({ basePath: "/tmp", language: "en" })).toEqual({
      ok: false,
      error: "fff unavailable on node runtime",
    })
  })
})
