import { describe, expect, test } from "bun:test"
import type { PromptRef } from "../../../src/component/prompt"
import { implementPlanInCurrentContext } from "../../../src/routes/session"

describe("implementPlanInCurrentContext", () => {
  test("submits after the prompt remounts", () => {
    const calls: string[] = []
    let prompt: Pick<PromptRef, "set" | "submit"> | undefined
    let deferred: (() => void) | undefined

    implementPlanInCurrentContext({
      plan: { messageID: "message-1" },
      prompt: () => prompt,
      finish: (messageID) => calls.push(`finish:${messageID}`),
      build: () => calls.push("build"),
      message: "implement",
      defer: (callback) => {
        deferred = callback
      },
    })

    expect(calls).toEqual(["finish:message-1", "build"])
    prompt = {
      set: (value) => calls.push(`set:${value.input}`),
      submit: () => calls.push("submit"),
    }
    deferred?.()
    expect(calls).toEqual(["finish:message-1", "build", "set:implement", "submit"])
  })

  test("does nothing when the plan is no longer pending", () => {
    const calls: string[] = []

    implementPlanInCurrentContext({
      plan: undefined,
      prompt: () => undefined,
      finish: () => calls.push("finish"),
      build: () => calls.push("build"),
      message: "implement",
      defer: () => calls.push("defer"),
    })

    expect(calls).toEqual([])
  })

  test("does not submit when the prompt does not remount", () => {
    const calls: string[] = []

    implementPlanInCurrentContext({
      plan: { messageID: "message-1" },
      prompt: () => undefined,
      finish: () => calls.push("finish"),
      build: () => calls.push("build"),
      message: "implement",
      defer: (callback) => callback(),
    })

    expect(calls).toEqual(["finish", "build"])
  })
})
