import { describe, expect, test } from "bun:test"
import type { Part, ToolPart } from "@miaopan/sdk/v2"
import { isThinkingMode, reasoningSummary } from "../../../src/context/thinking"
import { assistantDisplayParts, compactToolRows, toolUsesCompactDisplay } from "../../../src/routes/session"

test("recognizes the three thinking display modes", () => {
  expect(["collapsed", "expanded", "hidden"].every(isThinkingMode)).toBe(true)
  expect(isThinkingMode("hide")).toBe(false)
})

describe("reasoningSummary", () => {
  test("extracts a leading summary title and leaves markdown body", () => {
    expect(reasoningSummary("**Continuing Quality Review**\n\nDetails.\n\n**Next section**\n\nMore.")).toEqual({
      title: "Continuing Quality Review",
      body: "Details.\n\n**Next section**\n\nMore.",
    })
  })

  test("extracts a completed title before its streamed body arrives", () => {
    expect(reasoningSummary("**Continuing Quality Review**")).toEqual({
      title: "Continuing Quality Review",
      body: "",
    })
  })

  test("preserves markdown-significant indentation in the extracted body", () => {
    expect(reasoningSummary("**Continuing Quality Review**\n\n    const value = true\n")).toEqual({
      title: "Continuing Quality Review",
      body: "    const value = true",
    })
  })

  test("does not consume ordinary leading bold content", () => {
    expect(reasoningSummary("**Important:** keep this in the body.")).toEqual({
      title: null,
      body: "**Important:** keep this in the body.",
    })
  })

  test("leaves content without a leading title in its body", () => {
    expect(reasoningSummary("Details only.")).toEqual({ title: null, body: "Details only." })
  })
})

describe("assistantDisplayParts", () => {
  const tool = (name: string, input: Record<string, unknown>, metadata: Record<string, unknown> = {}) =>
    ({
      id: `part_${name}`,
      sessionID: "session",
      messageID: "message",
      type: "tool",
      callID: `call_${name}`,
      tool: name,
      state: {
        status: "completed",
        input,
        output: "done",
        title: name,
        metadata,
        time: { start: 1, end: 2 },
      },
    }) as ToolPart

  const reasoning = {
    id: "part_reasoning",
    sessionID: "session",
    messageID: "message",
    type: "reasoning",
    text: "Inspecting",
    time: { start: 1, end: 2 },
  } as Part

  const streamingReasoning = {
    ...reasoning,
    id: "part_streaming_reasoning",
    time: { start: 3 },
  } as Part

  test("removes hidden reasoning without changing the following text part", () => {
    const text = {
      id: "part_text",
      sessionID: "session",
      messageID: "message",
      type: "text",
      text: "Done",
      time: { start: 3, end: 4 },
    } as Part
    const parts = [reasoning, text]

    expect(
      assistantDisplayParts(parts, {
        last: true,
        thinkingMode: "hidden",
        toolDisplay: "compact",
        showDetails: true,
      }).map((part) => part.type),
    ).toEqual(["text"])
    expect(
      assistantDisplayParts(parts, {
        last: false,
        thinkingMode: "hidden",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([text])
  })

  test("hides synthetic assistant text parts", () => {
    const synthetic = {
      id: "part_synthetic",
      sessionID: "session",
      messageID: "message",
      type: "text",
      text: "<brief-conversation-history>history</brief-conversation-history>",
      synthetic: true,
    } as Part
    const text = {
      id: "part_text",
      sessionID: "session",
      messageID: "message",
      type: "text",
      text: "Done",
    } as Part

    expect(
      assistantDisplayParts([synthetic, text], {
        last: false,
        thinkingMode: "expanded",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([text])
  })

  test("removes hidden reasoning without changing the following compact tool group", () => {
    const tool = {
      id: "part_tool",
      sessionID: "session",
      messageID: "message",
      type: "tool",
      callID: "call",
      tool: "read",
      state: {
        status: "completed",
        input: { filePath: "src/index.ts" },
        output: "content",
        title: "src/index.ts",
        metadata: {},
        time: { start: 3, end: 4 },
      },
    } as Part
    const parts = [reasoning, tool]

    expect(
      assistantDisplayParts(parts, {
        last: true,
        thinkingMode: "hidden",
        toolDisplay: "compact",
        showDetails: true,
      }).map((part) => part.type),
    ).toEqual(["compact-explore"])
    expect(
      assistantDisplayParts(parts, {
        last: false,
        thinkingMode: "hidden",
        toolDisplay: "compact",
        showDetails: true,
      }).map((part) => part.type),
    ).toEqual(["compact-explore"])
  })

  test("keeps user-input tools standalone in compact mode", () => {
    const question = tool("question", { questions: [{ question: "What should change?" }] }, { answers: [["The TUI"]] })
    const request = tool(
      "request_user_input",
      { questions: [{ id: "scope", question: "What should change?" }] },
      { answers: { scope: { answers: ["The TUI"] } } },
    )

    expect([question, request].map(toolUsesCompactDisplay)).toEqual([false, false])
    expect(
      assistantDisplayParts([question, request], {
        last: true,
        thinkingMode: "collapsed",
        toolDisplay: "compact",
        showDetails: false,
      }),
    ).toEqual([question, request])
  })

  test("keeps only the last streaming reasoning in the current message", () => {
    const parts = [reasoning, streamingReasoning]

    expect(
      assistantDisplayParts(parts, {
        last: true,
        thinkingMode: "hidden",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([streamingReasoning])
  })

  test("removes streaming reasoning from a message that is no longer last", () => {
    expect(
      assistantDisplayParts([streamingReasoning], {
        last: false,
        thinkingMode: "hidden",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([])
  })

  test.each(["collapsed", "expanded"] as const)("keeps reasoning in %s mode", (thinkingMode) => {
    expect(
      assistantDisplayParts([reasoning], {
        last: false,
        thinkingMode,
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([reasoning])
  })

  test("keeps separate editing tool calls in separate compact rows", () => {
    const write = tool("write", { filePath: "/repo/new.ts" })
    const edit = tool("edit", { filePath: "/repo/existing.ts" })
    const move = tool(
      "apply_patch",
      {},
      {
        files: [
          {
            type: "move",
            relativePath: "renamed.ts",
            filePath: "/repo/original.ts",
            movePath: "/repo/renamed.ts",
            patch: "",
            deletions: 0,
          },
          {
            type: "delete",
            relativePath: "obsolete.ts",
            filePath: "/repo/obsolete.ts",
            patch: "-obsolete",
            deletions: 1,
          },
        ],
        diagnostics: {},
      },
    )

    const result = assistantDisplayParts([write, edit, move], {
      last: true,
      thinkingMode: "collapsed",
      toolDisplay: "compact",
      showDetails: true,
    })

    expect(result).toEqual([
      { type: "compact-explore", parts: [write] },
      { type: "compact-explore", parts: [edit] },
      { type: "compact-explore", parts: [move] },
    ])
    expect(compactToolRows([move], (value) => value ?? "")).toEqual([
      { key: "move", labels: "/repo/original.ts → /repo/renamed.ts" },
      { key: "delete", labels: "/repo/obsolete.ts" },
    ])
  })

  test("merges consecutive calls to the same tool without crossing tool boundaries", () => {
    const grepFirst = tool("grep", { pattern: "CompactExplore" })
    const readFirst = tool("read", { filePath: "/repo/src/index.ts" })
    const readSecond = tool("read", { filePath: "/repo/src/tool.ts" })
    const grepSecond = tool("grep", { pattern: "compactToolRows" })

    expect(
      assistantDisplayParts([grepFirst, readFirst, readSecond, grepSecond], {
        last: true,
        thinkingMode: "collapsed",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([
      { type: "compact-explore", parts: [grepFirst] },
      { type: "compact-explore", parts: [readFirst, readSecond] },
      { type: "compact-explore", parts: [grepSecond] },
    ])
  })

  test("keeps editing tools with diff or file content out of compact groups", () => {
    const write = tool("write", { filePath: "/repo/new.ts", content: "export {}" }, { diagnostics: {} })
    const edit = tool("edit", { filePath: "/repo/existing.ts" }, { diff: "-old\n+new", diagnostics: {} })
    const patch = tool(
      "apply_patch",
      {},
      {
        files: [
          {
            type: "update",
            relativePath: "existing.ts",
            filePath: "/repo/existing.ts",
            patch: "-old\n+new",
            deletions: 1,
          },
        ],
        diagnostics: {},
      },
    )

    expect([write, edit, patch].map(toolUsesCompactDisplay)).toEqual([false, false, false])
    expect(
      assistantDisplayParts([write, edit, patch], {
        last: true,
        thinkingMode: "collapsed",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([write, edit, patch])
  })

  test("keeps apply_patch diagnostics visible even without a diff", () => {
    const move = tool(
      "apply_patch",
      {},
      {
        files: [
          {
            type: "move",
            relativePath: "renamed.ts",
            filePath: "/repo/original.ts",
            movePath: "/repo/renamed.ts",
            patch: "",
            deletions: 0,
          },
        ],
        diagnostics: {
          "/repo/renamed.ts": [{ severity: 1, message: "broken", range: { start: { line: 0, character: 0 } } }],
        },
      },
    )

    expect(toolUsesCompactDisplay(move)).toBe(false)
  })

  test("formats both paths in compact move rows", () => {
    const move = tool(
      "apply_patch",
      {},
      {
        files: [
          {
            type: "move",
            relativePath: "root/.config/miaopan-code/tui.jsonc",
            filePath: "/root/.config/miaopan-code/tui.json",
            movePath: "/root/.config/miaopan-code/tui.jsonc",
            patch: "",
            deletions: 0,
          },
        ],
      },
    )

    expect(compactToolRows([move], (value) => value?.replace(/^\/root/, "~") ?? "")).toEqual([
      {
        key: "move",
        labels: "~/.config/miaopan-code/tui.json → ~/.config/miaopan-code/tui.jsonc",
      },
    ])
  })

  test("does not compact editing tools in detailed mode", () => {
    const edit = tool("edit", { filePath: "/repo/existing.ts" })
    expect(
      assistantDisplayParts([edit], {
        last: true,
        thinkingMode: "collapsed",
        toolDisplay: "detailed",
        showDetails: true,
      }),
    ).toEqual([edit])
  })

  test("keeps Task and Execute rows outside compact exploration", () => {
    const task = tool("task", { description: "Inspect the long-running task" })
    const execute = tool("execute", {}, { toolCalls: [{ tool: "read", status: "completed" }] })

    expect(
      assistantDisplayParts([task, execute], {
        last: true,
        thinkingMode: "collapsed",
        toolDisplay: "compact",
        showDetails: true,
      }),
    ).toEqual([task, execute])
  })
})
