import { describe, expect, test } from "bun:test"
import type { QuestionRequest } from "@miaopan/sdk/v2"
import {
  createQuestionBodyState,
  questionConfirm,
  questionReject,
  questionSave,
  questionSaveNoteAndCommit,
  questionSaveNote,
  questionSelect,
  questionSetNoteEditing,
  questionSetSelected,
  questionStoreCustom,
  questionStoreNote,
  questionSubmit,
  questionSync,
} from "@/cli/cmd/run/question.shared"

function req(input: Partial<QuestionRequest> = {}): QuestionRequest {
  return {
    id: "question-1",
    sessionID: "session-1",
    questions: [
      {
        question: "Mode?",
        header: "Mode",
        options: [{ label: "chunked", description: "Incremental output" }],
        multiple: false,
      },
    ],
    ...input,
  }
}

describe("run question shared", () => {
  test("replies immediately for a single-select question", () => {
    const out = questionSelect(createQuestionBodyState("question-1"), req())

    expect(out.reply).toEqual({
      requestID: "question-1",
      answers: [["chunked"]],
    })
  })

  test("advances multi-question flows and submits from confirm", () => {
    const ask = req({
      questions: [
        {
          question: "Mode?",
          header: "Mode",
          options: [{ label: "chunked", description: "Incremental output" }],
          multiple: false,
        },
        {
          question: "Output?",
          header: "Output",
          options: [
            { label: "yes", description: "Show tool output" },
            { label: "no", description: "Hide tool output" },
          ],
          multiple: false,
        },
      ],
    })

    let state = questionSelect(createQuestionBodyState("question-1"), ask).state
    expect(state.tab).toBe(1)

    state = questionSetSelected(state, 1)
    state = questionSelect(state, ask).state
    expect(questionConfirm(ask, state)).toBe(true)
    expect(questionSubmit(ask, state)).toEqual({
      requestID: "question-1",
      answers: [["chunked"], ["no"]],
    })
  })

  test("toggles answers for multiple-choice questions", () => {
    const ask = req({
      questions: [
        {
          question: "Tags?",
          header: "Tags",
          options: [{ label: "bug", description: "Bug fix" }],
          multiple: true,
        },
      ],
    })

    let state = questionSelect(createQuestionBodyState("question-1"), ask).state
    expect(state.answers).toEqual([["bug"]])

    state = questionSelect(state, ask).state
    expect(state.answers).toEqual([[]])
  })

  test("stores and submits custom answers", () => {
    let state = questionSetSelected(createQuestionBodyState("question-1"), 1)
    let next = questionSelect(state, req())
    expect(next.state.editing).toBe(true)

    state = questionStoreCustom(next.state, 0, "  custom mode  ")
    next = questionSave(state, req())
    expect(next.reply).toBeUndefined()
    expect(next.state.answers).toEqual([["custom mode"]])

    next = questionSelect(next.state, req())
    expect(next.reply).toEqual({
      requestID: "question-1",
      answers: [["custom mode"]],
    })
  })

  test("appends a trimmed note after the selected answer", () => {
    const state = questionStoreNote(
      questionSetSelected(createQuestionBodyState("question-1"), 0),
      0,
      "  prefer the smaller change  ",
    )

    expect(questionSelect(state, req()).reply).toEqual({
      requestID: "question-1",
      answers: [["chunked", "user_note: prefer the smaller change"]],
    })
  })

  test("submits or advances when saving a note", () => {
    let state = questionStoreNote(questionSetSelected(createQuestionBodyState("question-1"), 0), 0, "old")
    state = questionSelect(state, req()).state
    state = questionSetNoteEditing(state, true)

    expect(questionSaveNoteAndCommit(state, req(), " next ").reply).toEqual({
      requestID: "question-1",
      answers: [["chunked", "user_note: next"]],
    })

    const ask = req({
      questions: [
        {
          question: "First?",
          header: "First",
          options: [{ label: "yes", description: "Yes" }],
          multiple: false,
        },
        {
          question: "Second?",
          header: "Second",
          options: [{ label: "no", description: "No" }],
          multiple: false,
        },
      ],
    })
    state = questionSetNoteEditing(createQuestionBodyState("question-1"), true)
    const next = questionSaveNoteAndCommit(state, ask, "first note")
    expect(next.reply).toBeUndefined()
    expect(next.state.tab).toBe(1)
    expect(next.state.notes).toEqual(["first note"])
  })

  test("stores notes independently for each question", () => {
    const ask = req({
      questions: [
        {
          question: "Mode?",
          header: "Mode",
          options: [{ label: "chunked", description: "Incremental output" }],
          multiple: false,
        },
        {
          question: "Output?",
          header: "Output",
          options: [{ label: "yes", description: "Show tool output" }],
          multiple: false,
        },
      ],
    })
    let state = questionStoreNote(createQuestionBodyState("question-1"), 0, "first")
    state = questionSetNoteEditing(state, true)
    state = questionSaveNote(state, " first ")
    state = questionSetSelected(state, 0)
    state = questionSelect(state, ask).state
    state = questionStoreNote(state, 1, "second")

    expect(questionSubmit(ask, state)).toEqual({
      requestID: "question-1",
      answers: [["chunked", "user_note: first"], ["user_note: second"]],
    })
  })

  test("resets state when the request id changes and builds reject payloads", () => {
    const state = questionSetSelected(createQuestionBodyState("question-1"), 1)

    expect(questionSync(state, "question-1")).toBe(state)
    expect(questionSync(state, "question-2")).toEqual(createQuestionBodyState("question-2"))
    expect(questionReject(req())).toEqual({
      requestID: "question-1",
    })
  })
})
