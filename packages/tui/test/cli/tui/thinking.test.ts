import { describe, expect, test } from "bun:test"
import type { Part } from "@miaopan/sdk/v2"
import { isThinkingMode, reasoningSummary } from "../../../src/context/thinking"
import { assistantDisplayParts } from "../../../src/routes/session"

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
})
