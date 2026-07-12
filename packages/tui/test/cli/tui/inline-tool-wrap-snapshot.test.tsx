import { afterEach, describe, expect, test } from "bun:test"
import { createSignal, For, Show } from "solid-js"
import type { BoxRenderable, ScrollBoxRenderable } from "@opentui/core"
import type { ToolPart } from "@miaopan/sdk/v2"
import { testRender, type JSX } from "@opentui/solid"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { I18nProvider } from "../../../src/context/i18n"
import { KVProvider } from "../../../src/context/kv"
import { ThemeProvider } from "../../../src/context/theme"
import { TuiConfigProvider } from "../../../src/config"
import {
  formatCompletedSubagentDetail,
  formatSubagentRetry,
  formatSubagentTitle,
  formatSubagentToolcalls,
  InlineToolRow,
  parseApplyPatchFiles,
  parseDiagnostics,
  parseQuestionAnswers,
  parseQuestions,
  parseRequestUserInputAnswers,
  parseRequestUserInputQuestions,
  parseTodos,
  RequestUserInput,
  shellCommandSucceeded,
  toolDetailsHidden,
  alwaysSeparate,
  toolDisplay,
} from "../../../src/routes/session"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"
import { TestTuiContexts } from "../../fixture/tui-environment"
import { tmpdir } from "../../fixture/fixture"
import { splitQuestionAnswer } from "../../../src/routes/session/question.shared"

let testSetup: Awaited<ReturnType<typeof testRender>> | undefined

afterEach(() => {
  testSetup?.renderer.destroy()
  testSetup = undefined
})

type ToolFixture = { icon: string; label: string; error?: string }

const tools: readonly ToolFixture[] = [
  {
    icon: "✱",
    label:
      'Grep "MIAOPAN_CODE.*DB|database|sqlite|drizzle|dev.*db|data.*dir|xdg|APPDATA" in packages/miaopan-code/src (151 matches)',
  },
  {
    icon: "✱",
    label: 'Glob "**/*db*" in packages/miaopan-code (6 matches)',
  },
  {
    icon: "→",
    label: "Read packages/miaopan-code/src/storage/db.ts [offset=1, limit=130]",
  },
  {
    icon: "→",
    label: "Read packages/miaopan-code/src/index.ts [offset=1, limit=100]",
    error: "No LSP server available for this file type.",
  },
  {
    icon: "✱",
    label:
      'Grep "export const MIAOPAN_CODE_DB|MIAOPAN_CODE_DB|MIAOPAN_CODE_DEV|Global\\.Path\\.data|data =" in packages/miaopan-code/src (115 matches)',
  },
] as const

function ShellOutput() {
  return (
    <box
      ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
      marginTop={1}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      gap={1}
    >
      <box gap={1}>
        <text>$ ls</text>
        <text>file.ts</text>
      </box>
    </box>
  )
}

function UserMessage() {
  return (
    <box ref={(el: BoxRenderable) => alwaysSeparate.add(el)}>
      <box paddingTop={1} paddingBottom={1} paddingLeft={2}>
        <text>Check whether the next tool remains separated.</text>
      </box>
    </box>
  )
}

function Fixture(props: { errorExpanded?: boolean; before?: "shell" | "user" }) {
  return (
    <box flexDirection="column" width={72}>
      <box flexDirection="column">
        {props.before === "shell" && <ShellOutput />}
        {props.before === "user" && <UserMessage />}
        <For each={tools}>
          {(item) => (
            <InlineToolRow
              icon={item.icon}
              complete={true}
              pending=""
              failed={Boolean(item.error)}
              error={item.error}
              errorExpanded={props.errorExpanded}
            >
              {item.label}
            </InlineToolRow>
          )}
        </For>
      </box>
    </box>
  )
}

function TaskRowsFixture() {
  return (
    <box flexDirection="column" width={72}>
      <InlineToolRow icon="✱" complete={true} pending="">
        Grep "Task" (2 matches)
      </InlineToolRow>
      <InlineToolRow icon="⠙" complete={true} pending="" separate={true}>
        Explore Task — Inspect active task spacing
      </InlineToolRow>
      <InlineToolRow icon="✓" complete={true} pending="" separate={true}>
        {"General Task — Confirm completed task spacing\n↳ 1 toolcall · 501ms"}
      </InlineToolRow>
      <InlineToolRow icon="→" complete={true} pending="">
        Read src/cli/cmd/tui/routes/session/index.tsx
      </InlineToolRow>
    </box>
  )
}

function LoadedReadBeforeTaskFixture() {
  return (
    <box flexDirection="column" width={72}>
      <InlineToolRow icon="→" complete={true} pending="">
        Read src/cli/cmd/tui/routes/session/index.tsx
      </InlineToolRow>
      <box paddingLeft={3}>
        <text paddingLeft={3}>↳ Loaded src/cli/cmd/tui/routes/session/tools.tsx</text>
      </box>
      <InlineToolRow icon="✓" complete={true} pending="" separate={true}>
        {"Explore Task — Inspect active task spacing\n↳ 1 toolcall · 501ms"}
      </InlineToolRow>
    </box>
  )
}

function AssistantSummaryBeforeInlineFixture() {
  return (
    <box flexDirection="column" width={72}>
      <box ref={(el: BoxRenderable) => alwaysSeparate.add(el)} paddingLeft={3}>
        <text>▣ Build · Little Frank · 53.1s</text>
      </box>
      <InlineToolRow icon="✓" complete={true} pending="">
        {"Build Task — Review changes\n↳ 48 toolcalls · 1m 40s"}
      </InlineToolRow>
    </box>
  )
}

function AssistantErrorBeforeInlineFixture() {
  return (
    <box flexDirection="column" width={72}>
      <box
        ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
        border={["left"]}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
      >
        <text>Managed inference requires an active Member plan</text>
      </box>
      <InlineToolRow icon="✓" complete={true} pending="">
        {"Build Task — Review changes\n↳ 48 toolcalls · 1m 40s"}
      </InlineToolRow>
    </box>
  )
}

function StickyScrollFixture(props: { separated: boolean; scroll: (scroll: ScrollBoxRenderable) => void }) {
  return (
    <scrollbox ref={props.scroll} stickyScroll={true} stickyStart="bottom" height={3} width={72}>
      <box height={1}>
        <text>First row</text>
      </box>
      <box height={1}>
        <text>Second row</text>
      </box>
      <Show when={props.separated}>
        <box ref={(el: BoxRenderable) => alwaysSeparate.add(el)}>
          <text>Assistant text</text>
        </box>
      </Show>
      <InlineToolRow icon="→" complete={true} pending="">
        Read src/cli/cmd/tui/routes/session/index.tsx
      </InlineToolRow>
    </scrollbox>
  )
}

function FailedPendingToolFixture() {
  return (
    <InlineToolRow icon="%" complete={false} pending="Preparing patch..." failed={true} failure="Patch failed">
      Patch
    </InlineToolRow>
  )
}

function FailedCompleteToolFixture() {
  return (
    <InlineToolRow icon="→" complete={true} pending="Reading file..." failed={true} failure="Read failed">
      Read src/index.ts
    </InlineToolRow>
  )
}

function DenseRowsFixture() {
  return (
    <box flexDirection="column" width={40}>
      <InlineToolRow icon="✱" complete={true} pending="" dense>
        Grep a very long pattern that wraps before the next tool
      </InlineToolRow>
      <InlineToolRow icon="→" complete={true} pending="" dense>
        Read src/index.ts
      </InlineToolRow>
    </box>
  )
}

function shellState(status: ToolPart["state"]["status"], exit?: unknown) {
  const metadata = exit === undefined ? undefined : { exit }
  if (status === "pending") return { status, input: {}, raw: "" } as ToolPart["state"]
  if (status === "running") return { status, input: {}, time: { start: 1 }, metadata } as ToolPart["state"]
  if (status === "completed")
    return { status, input: {}, output: "", title: "", time: { start: 1, end: 2 }, metadata } as ToolPart["state"]
  return { status, input: {}, error: "failed", time: { start: 1, end: 2 }, metadata } as ToolPart["state"]
}

async function renderFrame(component: () => JSX.Element, options: { width: number; height: number }) {
  testSetup = await testRender(component, options)
  await testSetup.renderOnce()
  await testSetup.renderOnce()

  return testSetup
    .captureCharFrame()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trimEnd()
}

async function renderRequestUserInput() {
  await using tmp = await tmpdir()
  const state = path.join(tmp.path, "state")
  await mkdir(state, { recursive: true })
  await Bun.write(path.join(state, "kv.json"), "{}")

  const input = {
    questions: [
      {
        id: "scope",
        header: "范围",
        question: "哪些结果应该始终显示？",
        options: [
          { label: "提问结果", description: "显示提问和回答" },
          { label: "工具结果", description: "显示工具输出" },
        ],
      },
      {
        id: "note",
        header: "备注",
        question: "需要附加备注吗？",
        options: [
          { label: "需要", description: "保留备注" },
          { label: "不需要", description: "不保留备注" },
        ],
      },
      {
        id: "unanswered",
        header: "未答",
        question: "这个问题没有回答时如何显示？",
        options: [
          { label: "保留", description: "保留未回答状态" },
          { label: "隐藏", description: "隐藏未回答问题" },
        ],
      },
    ],
  }
  const metadata = {
    answers: {
      scope: { answers: ["提问结果"] },
      note: { answers: ["需要", "user_note: 保留备注"] },
    },
  }
  const part = {
    id: "part_request_user_input",
    sessionID: "session",
    messageID: "message",
    type: "tool" as const,
    callID: "call_request_user_input",
    tool: "request_user_input",
    state: {
      status: "completed" as const,
      input,
      output: JSON.stringify(metadata),
      title: "提问",
      metadata,
      time: { start: 1, end: 2 },
    },
  } as ToolPart

  const app = await testRender(
    () => (
      <TestTuiContexts paths={{ state }}>
        <TuiConfigProvider config={createTuiResolvedConfig({ tool_display: "compact" })}>
          <KVProvider>
            <I18nProvider language="zh-CN">
              <ThemeProvider mode="dark">
                <box width={72}>
                  <RequestUserInput input={input} metadata={metadata} tool={part.tool} part={part} />
                </box>
              </ThemeProvider>
            </I18nProvider>
          </KVProvider>
        </TuiConfigProvider>
      </TestTuiContexts>
    ),
    { width: 72, height: 16 },
  )

  try {
    for (let attempt = 0; attempt < 20; attempt++) {
      await app.renderOnce()
      const frame = app
        .captureCharFrame()
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trimEnd()
      if (frame) return frame
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return app
      .captureCharFrame()
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trimEnd()
  } finally {
    app.renderer.destroy()
  }
}

describe("TUI inline tool wrapping", () => {
  test("falls back for unknown tool names", () => {
    expect(toolDisplay("bash")).toBe("bash")
    expect(toolDisplay("plugin_tool")).toBe("generic")
  })

  test("replaces pending copy when a tool fails before completion", async () => {
    const frame = await renderFrame(() => <FailedPendingToolFixture />, { width: 72, height: 3 })
    expect(frame).toContain("Patch failed")
    expect(frame).not.toContain("Preparing patch")
  })

  test("preserves useful completed copy when a tool fails", async () => {
    const frame = await renderFrame(() => <FailedCompleteToolFixture />, { width: 72, height: 3 })
    expect(frame).toContain("Read src/index.ts")
    expect(frame).not.toContain("Read failed")
  })

  test("does not add a blank line between dense rows after wrapping", async () => {
    const frame = await renderFrame(() => <DenseRowsFixture />, { width: 40, height: 6 })
    expect(frame).not.toContain("\n\n")
    expect(frame).toContain("Read src/index.ts")
  })

  test("derives shell command success from tool state and exit metadata", () => {
    expect(shellCommandSucceeded(shellState("pending"))).toBeUndefined()
    expect(shellCommandSucceeded(shellState("running"))).toBeUndefined()
    expect(shellCommandSucceeded(shellState("completed", 0))).toBe(true)
    expect(shellCommandSucceeded(shellState("completed", 2))).toBe(false)
    expect(shellCommandSucceeded(shellState("completed", null))).toBe(false)
    expect(shellCommandSucceeded(shellState("completed"))).toBeUndefined()
    expect(shellCommandSucceeded(shellState("completed", Number.NaN))).toBeUndefined()
    expect(shellCommandSucceeded(shellState("error"))).toBe(false)
  })

  test("hides completed tool details while preserving active and failed commands", () => {
    expect(toolDetailsHidden(false, "read", shellState("completed", 0))).toBe(true)
    expect(toolDetailsHidden(false, "read", shellState("running"))).toBe(false)
    expect(toolDetailsHidden(false, "bash", shellState("completed", 2))).toBe(false)
    expect(toolDetailsHidden(true, "read", shellState("completed", 0))).toBe(false)
  })

  test("keeps completed request_user_input details visible", () => {
    expect(toolDisplay("request_user_input")).toBe("request_user_input")
    expect(toolDetailsHidden(false, "request_user_input", shellState("completed", 0))).toBe(false)
  })

  test("filters malformed nested tool wire data", () => {
    expect(
      parseApplyPatchFiles([
        null,
        { type: "add" },
        { type: "add", relativePath: "a.ts", filePath: "a.ts", patch: "diff", deletions: 0 },
      ]),
    ).toEqual([
      { type: "add", relativePath: "a.ts", filePath: "a.ts", patch: "diff", deletions: 0, movePath: undefined },
    ])
    expect(parseTodos([null, { status: "pending" }, { status: "pending", content: "Safe" }])).toEqual([
      { status: "pending", content: "Safe" },
    ])
    expect(parseQuestions([{}, { question: 1 }, { question: "Continue?" }])).toEqual([{ question: "Continue?" }])
    expect(parseQuestionAnswers([null, ["yes", 1], "no"])).toEqual([[], ["yes"], []])
    expect(parseQuestionAnswers({})).toBeUndefined()
    expect(
      parseRequestUserInputQuestions([
        {},
        { id: "scope", question: "What should change?" },
        { id: "missing-question" },
      ]),
    ).toEqual([{ id: "scope", question: "What should change?" }])
    expect(
      parseRequestUserInputAnswers({
        scope: { answers: ["The TUI", "user_note: keep it visible"] },
        malformed: { answers: ["valid", 1] },
        missing: {},
      }),
    ).toEqual({
      scope: ["The TUI", "user_note: keep it visible"],
      malformed: ["valid"],
    })
    expect(splitQuestionAnswer(["yes", "user_note: keep the change small"])).toEqual({
      answers: ["yes"],
      notes: ["keep the change small"],
    })
  })

  test("ignores diagnostics with malformed nested ranges", () => {
    expect(
      parseDiagnostics(
        {
          "a.ts": [
            { severity: 1, message: "missing range" },
            { severity: 1, message: "bad line", range: { start: { line: "0", character: 1 } } },
            { severity: 1, message: "valid", range: { start: { line: 2, character: 3 } } },
          ],
        },
        "a.ts",
      ),
    ).toEqual([{ message: "valid", range: { start: { line: 2, character: 3 } } }])
  })

  test("formats completed subagent toolcall details", () => {
    expect(formatCompletedSubagentDetail(0, "501ms")).toBe("501ms")
    expect(formatCompletedSubagentDetail(1, "501ms")).toBe("1 次工具调用 · 501ms")
    expect(formatCompletedSubagentDetail(2, "501ms")).toBe("2 次工具调用 · 501ms")
    expect(formatSubagentToolcalls(0)).toBe("0 次工具调用")
  })

  test("keeps background state attached to the subagent identity", () => {
    expect(formatSubagentTitle("Explore", "Inspect renderer", false)).toBe("Explore 任务 — Inspect renderer")
    expect(formatSubagentTitle("Explore", "Inspect renderer", true)).toBe("Explore 任务 (后台) — Inspect renderer")
  })

  test("keeps retry status ahead of wrapping messages", () => {
    expect(formatSubagentRetry(2, "Rate limited by provider")).toBe("重试中（第 2 次）· Rate limited by provider")
  })

  test("snapshots consecutive grep, glob, and read rows at a narrow width", async () => {
    expect(await renderFrame(() => <Fixture />, { width: 72, height: 12 })).toMatchSnapshot()
  })

  test("renders completed request_user_input results in compact mode", async () => {
    expect(await renderRequestUserInput()).toMatchSnapshot()
  })

  test("snapshots expanded tool errors under the tool text", async () => {
    expect(await renderFrame(() => <Fixture errorExpanded />, { width: 72, height: 12 })).toMatchSnapshot()
  })

  test("keeps separation after a shell output block", async () => {
    expect(await renderFrame(() => <Fixture before="shell" />, { width: 72, height: 16 })).toMatchSnapshot()
  })

  test("keeps separation after a padded user message", async () => {
    expect(await renderFrame(() => <Fixture before="user" />, { width: 72, height: 14 })).toMatchSnapshot()
  })

  test("separates after a multi-line task row", async () => {
    expect(await renderFrame(() => <TaskRowsFixture />, { width: 72, height: 10 })).toMatchSnapshot()
  })

  test("separates a task row from a preceding inline detail", async () => {
    expect(await renderFrame(() => <LoadedReadBeforeTaskFixture />, { width: 72, height: 8 })).toMatchSnapshot()
  })

  test("separates an inline row from the previous assistant summary", async () => {
    expect(await renderFrame(() => <AssistantSummaryBeforeInlineFixture />, { width: 72, height: 5 })).toMatchSnapshot()
  })

  test("separates an inline row from the previous assistant error", async () => {
    expect(await renderFrame(() => <AssistantErrorBeforeInlineFixture />, { width: 72, height: 7 })).toMatchSnapshot()
  })

  test("updates sticky-bottom geometry when a text separator mounts and unmounts", async () => {
    const [separated, setSeparated] = createSignal(false)
    let scroll: ScrollBoxRenderable | undefined
    testSetup = await testRender(
      () => <StickyScrollFixture separated={separated()} scroll={(value) => (scroll = value)} />,
      {
        width: 72,
        height: 3,
      },
    )

    await testSetup.renderOnce()
    expect(scroll?.scrollHeight).toBe(3)
    expect(scroll?.scrollTop).toBe(Math.max(0, scroll!.scrollHeight - scroll!.viewport.height))

    setSeparated(true)
    await testSetup.renderOnce()
    expect(scroll?.scrollHeight).toBe(5)
    expect(scroll?.scrollTop).toBe(Math.max(0, scroll!.scrollHeight - scroll!.viewport.height))

    setSeparated(false)
    await testSetup.renderOnce()
    expect(scroll?.scrollHeight).toBe(3)
    expect(scroll?.scrollTop).toBe(Math.max(0, scroll!.scrollHeight - scroll!.viewport.height))
  })
})
