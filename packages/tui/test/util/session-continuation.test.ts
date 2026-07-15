import { describe, expect, test } from "bun:test"
import type { AssistantMessage, Part } from "@miaopan/sdk/v2"
import { projectContinuationMessages, type MessageWithParts } from "../../src/util/session-continuation"

function assistant(id: string, parentID: string, error?: AssistantMessage["error"]): AssistantMessage {
  return {
    id,
    sessionID: "ses_test",
    role: "assistant",
    time: { created: 0, completed: 1 },
    error,
    parentID,
    modelID: "model",
    providerID: "provider",
    mode: "build",
    agent: "build",
    path: { cwd: "/", root: "/" },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  }
}

function text(id: string, messageID: string, value: string): Part {
  return { id, sessionID: "ses_test", messageID, type: "text", text: value }
}

describe("projectContinuationMessages", () => {
  test("folds partial text into the continued assistant and hides interrupted tools", () => {
    const input: MessageWithParts[] = [
      {
        info: assistant("msg_1", "msg_user", {
          name: "MessageAbortedError",
          data: { message: "aborted" },
        }),
        parts: [
          { id: "prt_0", sessionID: "ses_test", messageID: "msg_1", type: "step-start" },
          text("prt_1", "msg_1", "partial "),
          {
            id: "prt_2",
            sessionID: "ses_test",
            messageID: "msg_1",
            type: "tool",
            callID: "call_1",
            tool: "bash",
            state: {
              status: "error",
              input: { command: "sleep 10" },
              error: "aborted",
              metadata: { interrupted: true, output: "partial output" },
              time: { start: 0, end: 1 },
            },
          },
        ],
      },
      {
        info: assistant("msg_2", "msg_user"),
        parts: [
          { id: "prt_3", sessionID: "ses_test", messageID: "msg_2", type: "step-start" },
          text("prt_4", "msg_2", "answer"),
        ],
      },
    ]

    expect(projectContinuationMessages(input)).toEqual([
      {
        info: assistant("msg_2", "msg_user"),
        parts: [text("prt_1", "msg_2", "partial answer")],
      },
    ])
    expect(input[0]?.parts).toHaveLength(3)
    expect(input[1]?.parts).toEqual([
      { id: "prt_3", sessionID: "ses_test", messageID: "msg_2", type: "step-start" },
      text("prt_4", "msg_2", "answer"),
    ])
  })

  test("does not mutate adjacent text parts in the input", () => {
    const input: MessageWithParts[] = [
      {
        info: assistant("msg_1", "msg_user", {
          name: "MessageAbortedError",
          data: { message: "aborted" },
        }),
        parts: [text("prt_1", "msg_1", "partial ")],
      },
      {
        info: assistant("msg_2", "msg_user"),
        parts: [text("prt_2", "msg_2", "continued "), text("prt_3", "msg_2", "answer")],
      },
    ]

    expect(projectContinuationMessages(input)[0]?.parts).toEqual([text("prt_1", "msg_2", "partial continued answer")])
    expect(input[1]?.parts).toEqual([text("prt_2", "msg_2", "continued "), text("prt_3", "msg_2", "answer")])
  })

  test("keeps the latest failure visible until another assistant supersedes it", () => {
    const input: MessageWithParts[] = [
      {
        info: assistant("msg_1", "msg_user", {
          name: "APIError",
          data: { message: "failed", isRetryable: false },
        }),
        parts: [text("prt_1", "msg_1", "partial")],
      },
    ]

    expect(projectContinuationMessages(input)).toEqual(input)
  })

  test("preserves real tool failures from superseded attempts", () => {
    const tool: Part = {
      id: "prt_2",
      sessionID: "ses_test",
      messageID: "msg_1",
      type: "tool",
      callID: "call_1",
      tool: "bash",
      state: {
        status: "error",
        input: { command: "exit 1" },
        error: "exit code 1",
        time: { start: 0, end: 1 },
      },
    }
    const projected = projectContinuationMessages([
      {
        info: assistant("msg_1", "msg_user", {
          name: "APIError",
          data: { message: "stream failed", isRetryable: false },
        }),
        parts: [tool],
      },
      { info: assistant("msg_2", "msg_user"), parts: [text("prt_3", "msg_2", "done")] },
    ])

    expect(projected).toHaveLength(1)
    expect(projected[0]?.parts[0]).toMatchObject({ type: "tool", messageID: "msg_2" })
  })
})
