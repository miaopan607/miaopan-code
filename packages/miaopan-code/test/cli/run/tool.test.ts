import { afterEach, describe, expect, test } from "bun:test"
import { builtinToolDisplayName } from "@miaopan-code/core/i18n"
import type { ToolPart } from "@miaopan/sdk/v2"
import { toolInlineInfo, toolScroll, type ToolFrame } from "@/cli/cmd/run/tool"
import { UI } from "@/cli/ui"

function frame(name: string, input: Record<string, unknown> = {}): ToolFrame {
  return {
    raw: "",
    name,
    input,
    meta: {},
    state: {},
    status: "running",
    error: "",
  }
}

function part(tool: string): ToolPart {
  return {
    id: `${tool}-1`,
    sessionID: "session-1",
    messageID: "message-1",
    type: "tool",
    callID: `call-${tool}`,
    tool,
    state: {
      status: "running",
      input: {},
      time: { start: 1 },
    },
  } as ToolPart
}

afterEach(() => UI.setLanguage("zh-CN"))

describe("run tool fallback display", () => {
  test("localizes known built-in tools without dedicated rules", () => {
    UI.setLanguage("zh-CN")
    const tools = [
      "request_user_input",
      "get_goal",
      "create_goal",
      "update_goal",
      "execute",
      "list_mcp_resources",
      "list_mcp_resource_templates",
      "read_mcp_resource",
    ]

    for (const tool of tools) {
      const name = builtinToolDisplayName("zh-CN", tool)!
      expect(toolScroll("start", frame(tool))).toBe(`⚙ ${name}`)
      expect(toolInlineInfo(part(tool)).title).toStartWith(`${name} `)
      expect(toolInlineInfo(part(tool)).title).not.toContain(tool)
    }
  })

  test("uses localized failed and completed status wrappers", () => {
    UI.setLanguage("en")
    expect(
      toolScroll("final", {
        ...frame("execute"),
        status: "error",
        error: "boom",
      }),
    ).toBe("✖ Execute code failed: boom")
    expect(
      toolScroll("final", {
        ...frame("get_goal"),
        status: "completed",
      }),
    ).toBe("View goal completed")
  })

  test("preserves unknown tool identifiers", () => {
    UI.setLanguage("zh-CN")
    expect(toolScroll("start", frame("plugin_custom", { value: 1 }))).toBe("⚙ plugin_custom [value=1]")
    expect(
      toolScroll("final", {
        ...frame("plugin_custom"),
        status: "completed",
      }),
    ).toBe("plugin_custom 已完成")
    expect(toolInlineInfo(part("plugin_custom")).title).toStartWith("plugin_custom ")
  })
})
