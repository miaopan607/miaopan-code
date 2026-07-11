import { describe, expect, test } from "bun:test"
import { t } from "../src/i18n"
import { Question } from "../src/question"
import { makeWorkspaceID } from "../src/workspace-id"
import { Project } from "../src/project"
import { SessionTodo } from "../src/session-todo"
import { TuiEvent } from "../src/tui-event"
import { QuestionV1 } from "../src/v1/question"
import { Event } from "../src/event"
import { Schema } from "effect"

describe("Schema i18n", () => {
  test("defaults to Simplified Chinese and supports English", () => {
    expect(t(undefined, "workspace_id_prefix", { id: "bad" })).toBe("ID bad 不以 wrk 开头")
    expect(t("en", "workspace_id_prefix", { id: "bad" })).toBe("ID bad does not start with wrk")
  })

  test("language reaches real schema descriptions and validation errors", () => {
    expect(JSON.stringify(Question.make().Option.ast)).toContain("显示文本（1-5 个词，简洁）")
    expect(JSON.stringify(Question.make("en").Option.ast)).toContain("Display text (1-5 words, concise)")
    expect(JSON.stringify(Project.makeInfo("en").ast)).toContain("Startup script to run")
    expect(JSON.stringify(SessionTodo.make("en").ast)).toContain("Brief description of the task")
    expect(JSON.stringify(TuiEvent.make("en").ToastShow.ast)).toContain("Duration in milliseconds")
    expect(JSON.stringify(QuestionV1.make("en").Request.ast)).toContain("Questions to ask")
    expect(() => makeWorkspaceID("en").ascending("bad")).toThrow("ID bad does not start with wrk")
    const first = Event.define({ type: "duplicate", schema: { value: Schema.String } })
    const second = Event.define({ type: "duplicate", schema: { value: Schema.String } })
    expect(() => Event.latest([first, second], "en")).toThrow("Duplicate latest event definition for duplicate")
  })
})
