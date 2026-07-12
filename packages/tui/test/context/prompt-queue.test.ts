import { describe, expect, test } from "bun:test"
import { createPromptQueue } from "../../src/context/prompt-queue"

describe("prompt queue", () => {
  test("keeps FIFO entries isolated by session", () => {
    const queue = createPromptQueue()
    const first = queue.enqueue("one", { input: "first", parts: [] })
    queue.enqueue("one", { input: "second", parts: [] })
    queue.enqueue("two", { input: "other", parts: [] })

    expect(queue.items("one").map((item) => item.prompt.input)).toEqual(["first", "second"])
    expect(queue.items("two").map((item) => item.prompt.input)).toEqual(["other"])

    queue.remove("one", first.id)
    expect(queue.items("one").map((item) => item.prompt.input)).toEqual(["second"])
  })

  test("pops the most recent entry for editing", () => {
    const queue = createPromptQueue()
    queue.enqueue("one", { input: "first", parts: [] })
    queue.enqueue(
      "one",
      { input: "second", mode: "shell", parts: [] },
      [{ type: "text", text: "editor context", synthetic: true }],
    )

    expect(queue.pop("one")).toMatchObject({
      prompt: { input: "second", mode: "shell", parts: [] },
      editorParts: [{ type: "text", text: "editor context", synthetic: true }],
    })
    expect(queue.items("one").map((item) => item.prompt.input)).toEqual(["first"])
  })

  test("snapshots editor context independently from the caller", () => {
    const queue = createPromptQueue()
    const editorParts = [{ type: "text" as const, text: "original", synthetic: true }]
    const item = queue.enqueue("one", { input: "queued", parts: [] }, editorParts)

    editorParts[0].text = "changed"

    expect(item.editorParts).toEqual([{ type: "text", text: "original", synthetic: true }])
  })

  test("pauses and resumes automatic delivery by session", () => {
    const queue = createPromptQueue()

    queue.pause("one")
    expect(queue.isPaused("one")).toBe(true)
    expect(queue.isPaused("two")).toBe(false)

    queue.resume("one")
    expect(queue.isPaused("one")).toBe(false)
  })
})
