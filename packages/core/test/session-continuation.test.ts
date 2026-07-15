import { describe, expect, test } from "bun:test"
import { SessionContinuation } from "@miaopan-code/core/v1/session-continuation"

const attempt = (id: string, parentID: string, failed: boolean): SessionContinuation.Attempt => ({
  id,
  parentID,
  failed,
})

describe("SessionContinuation.resolve", () => {
  test("resolves repeated failures to their immediate later attempts", () => {
    expect(
      SessionContinuation.resolve({
        attempts: [
          attempt("assistant-1", "user-1", true),
          attempt("assistant-2", "user-1", true),
          attempt("assistant-3", "user-1", false),
        ],
      }),
    ).toEqual({
      superseded: ["assistant-1", "assistant-2"],
      targetByAssistantID: {
        "assistant-1": "assistant-2",
        "assistant-2": "assistant-3",
      },
    })
  })

  test("does not connect attempts with different parents", () => {
    expect(
      SessionContinuation.resolve({
        attempts: [attempt("assistant-1", "user-1", true), attempt("assistant-2", "user-2", false)],
      }),
    ).toEqual({ superseded: [], targetByAssistantID: {} })
  })

  test("does not overwrite a target after a failed attempt is resolved", () => {
    expect(
      SessionContinuation.resolve({
        attempts: [
          attempt("assistant-1", "user-1", true),
          attempt("assistant-2", "user-1", false),
          attempt("assistant-3", "user-1", false),
        ],
      }),
    ).toEqual({
      superseded: ["assistant-1"],
      targetByAssistantID: { "assistant-1": "assistant-2" },
    })
  })

  test("leaves a failed attempt without a later sibling untouched", () => {
    expect(
      SessionContinuation.resolve({
        attempts: [attempt("assistant-1", "user-1", true)],
      }),
    ).toEqual({ superseded: [], targetByAssistantID: {} })
  })

  test("marks the latest failure for the active parent without inventing a target", () => {
    expect(
      SessionContinuation.resolve({
        attempts: [attempt("assistant-1", "user-1", true), attempt("assistant-2", "user-2", true)],
        activeParentID: "user-2",
      }),
    ).toEqual({ superseded: ["assistant-2"], targetByAssistantID: {} })
  })

  test("does not mark an active parent after its latest attempt succeeds", () => {
    expect(
      SessionContinuation.resolve({
        attempts: [attempt("assistant-1", "user-1", true), attempt("assistant-2", "user-1", false)],
        activeParentID: "user-1",
      }),
    ).toEqual({ superseded: ["assistant-1"], targetByAssistantID: { "assistant-1": "assistant-2" } })
  })
})
