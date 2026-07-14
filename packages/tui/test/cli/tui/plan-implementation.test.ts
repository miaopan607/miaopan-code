import { describe, expect, test } from "bun:test"
import type { PromptRef } from "../../../src/component/prompt"
import {
  implementPlanInCurrentContext,
  implementPlanInFreshContext,
  isPlanSessionAvailable,
} from "../../../src/routes/session"

describe("isPlanSessionAvailable", () => {
  test("treats an unknown status as temporarily idle", () => {
    expect(isPlanSessionAvailable({ status: undefined, blocked: false })).toBe(true)
  })

  test("rejects an active status", () => {
    expect(isPlanSessionAvailable({ status: { type: "busy" }, blocked: false })).toBe(false)
  })

  test("rejects blocked sessions even when idle", () => {
    expect(isPlanSessionAvailable({ status: { type: "idle" }, blocked: true })).toBe(false)
  })
})

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

    expect(calls).toEqual(["finish:message-1"])
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

    expect(calls).toEqual(["finish"])
  })

  test("captures Build after the remounted prompt restores the old Plan agent", () => {
    let agent = "plan"
    let prompt: Pick<PromptRef, "set" | "submit"> | undefined
    let deferred: (() => void) | undefined
    const submittedAgents: string[] = []

    implementPlanInCurrentContext({
      plan: { messageID: "message-1" },
      prompt: () => prompt,
      finish: () => {},
      build: () => {
        agent = "build"
      },
      message: "implement",
      defer: (callback) => {
        deferred = callback
      },
    })

    prompt = {
      set: () => submittedAgents.push(`set:${agent}`),
      submit: () => submittedAgents.push(`submit:${agent}`),
    }
    deferred?.()

    expect(submittedAgents).toEqual(["set:build", "submit:build"])
  })
})

describe("implementPlanInFreshContext", () => {
  test("finishes after the async prompt is accepted", async () => {
    const calls: string[] = []
    let resolvePrompt!: () => void
    const promptAccepted = new Promise<void>((resolve) => {
      resolvePrompt = resolve
    })

    const implementation = implementPlanInFreshContext({
      plan: { messageID: "message-1" },
      create: async () => {
        calls.push("create")
        return { id: "session-2" }
      },
      promptAsync: async (sessionID) => {
        calls.push(`promptAsync:${sessionID}`)
        await promptAccepted
      },
      finish: (messageID) => calls.push(`finish:${messageID}`),
      build: () => calls.push("build"),
      navigate: (sessionID) => calls.push(`navigate:${sessionID}`),
    })

    await Promise.resolve()
    expect(calls).toEqual(["create", "promptAsync:session-2"])

    resolvePrompt()
    await implementation
    expect(calls).toEqual(["create", "promptAsync:session-2", "finish:message-1", "build", "navigate:session-2"])
  })

  test("passes creation failures to the existing error handler", async () => {
    const error = new Error("create failed")
    const calls: string[] = []
    const errors: unknown[] = []

    await implementPlanInFreshContext({
      plan: { messageID: "message-1" },
      create: async () => {
        calls.push("create")
        throw error
      },
      promptAsync: async () => {
        calls.push("promptAsync")
      },
      finish: () => calls.push("finish"),
      build: () => calls.push("build"),
      navigate: () => calls.push("navigate"),
    }).catch((reason) => errors.push(reason))

    expect(errors).toEqual([error])
    expect(calls).toEqual(["create"])
  })

  test("passes async prompt failures to the existing error handler", async () => {
    const error = new Error("prompt failed")
    const calls: string[] = []
    const errors: unknown[] = []

    await implementPlanInFreshContext({
      plan: { messageID: "message-1" },
      create: async () => {
        calls.push("create")
        return { id: "session-2" }
      },
      promptAsync: async () => {
        calls.push("promptAsync")
        throw error
      },
      finish: () => calls.push("finish"),
      build: () => calls.push("build"),
      navigate: () => calls.push("navigate"),
    }).catch((reason) => errors.push(reason))

    expect(errors).toEqual([error])
    expect(calls).toEqual(["create", "promptAsync"])
  })
})
