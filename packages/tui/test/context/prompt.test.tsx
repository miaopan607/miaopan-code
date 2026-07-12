/** @jsxImportSource @opentui/solid */
import { testRender } from "@opentui/solid"
import type { Event, GlobalEvent } from "@miaopan/sdk/v2"
import { onMount } from "solid-js"
import { expect, test } from "bun:test"
import { usePromptRef, PromptRefProvider } from "../../src/context/prompt"
import { SDKProvider } from "../../src/context/sdk"
import { createEventSource, createFetch, directory } from "../fixture/tui-sdk"
import { TestTuiContexts } from "../fixture/tui-environment"

function global(payload: Event): GlobalEvent {
  return { directory, project: "proj_test", payload }
}

async function mount() {
  const events = createEventSource()
  const calls = createFetch()
  let prompt!: ReturnType<typeof usePromptRef>
  let ready!: () => void
  const mounted = new Promise<void>((resolve) => {
    ready = resolve
  })

  function Probe() {
    prompt = usePromptRef()
    onMount(ready)
    return <box />
  }

  const app = await testRender(() => (
    <TestTuiContexts>
      <SDKProvider url="http://test" directory={directory} events={events.source} fetch={calls.fetch}>
        <PromptRefProvider>
          <Probe />
        </PromptRefProvider>
      </SDKProvider>
    </TestTuiContexts>
  ))

  await mounted
  return { app, events, prompt }
}

test("keeps submitted prompts isolated and cloned by session", async () => {
  const { app, prompt } = await mount()
  try {
    const value = {
      input: "hello",
      mode: "normal" as const,
      parts: [],
    }
    const editorParts = [{ type: "text" as const, text: "editor context", synthetic: true }]

    prompt.submitted.remember("one", value, editorParts)
    value.input = "changed"
    editorParts[0].text = "changed"

    expect(prompt.submitted.get("one")).toEqual({
      prompt: { input: "hello", mode: "normal", parts: [] },
      editorParts: [{ type: "text", text: "editor context", synthetic: true }],
    })
    expect(prompt.submitted.get("two")).toBeUndefined()
    expect(prompt.submitted.consume("one")).toEqual({
      prompt: { input: "hello", mode: "normal", parts: [] },
      editorParts: [{ type: "text", text: "editor context", synthetic: true }],
    })
    expect(prompt.submitted.get("one")).toBeUndefined()
  } finally {
    app.renderer.destroy()
  }
})

test("clears submitted prompts when their session becomes idle", async () => {
  const { app, events, prompt } = await mount()
  try {
    prompt.submitted.remember("one", { input: "one", parts: [] }, [])
    prompt.submitted.remember("two", { input: "two", parts: [] }, [])

    events.emit(
      global({ id: "busy", type: "session.status", properties: { sessionID: "one", status: { type: "busy" } } }),
    )
    await Bun.sleep(20)
    expect(prompt.submitted.get("one")?.prompt.input).toBe("one")

    events.emit(
      global({ id: "idle", type: "session.status", properties: { sessionID: "one", status: { type: "idle" } } }),
    )
    await Bun.sleep(20)
    expect(prompt.submitted.get("one")).toBeUndefined()
    expect(prompt.submitted.get("two")?.prompt.input).toBe("two")
  } finally {
    app.renderer.destroy()
  }
})
