/** @jsxImportSource @opentui/solid */
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { testRender, useRenderer } from "@opentui/solid"
import type { Event, GlobalEvent } from "@miaopan/sdk/v2"
import { expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import { createEffect, onCleanup } from "solid-js"
import { ArgsProvider } from "../../../src/context/args"
import { ClipboardProvider } from "../../../src/context/clipboard"
import { DataProvider } from "../../../src/context/data"
import { EditorContextProvider } from "../../../src/context/editor"
import { ExitProvider } from "../../../src/context/exit"
import { I18nProvider } from "../../../src/context/i18n"
import { KVProvider } from "../../../src/context/kv"
import { LocalProvider } from "../../../src/context/local"
import { PermissionProvider } from "../../../src/context/permission"
import { ProjectProvider } from "../../../src/context/project"
import { PromptQueueProvider } from "../../../src/context/prompt-queue"
import { PromptRefProvider } from "../../../src/context/prompt"
import { RouteProvider } from "../../../src/context/route"
import { SDKProvider } from "../../../src/context/sdk"
import { SyncProvider } from "../../../src/context/sync"
import { TuiPathsProvider, TuiStartupProvider, TuiTerminalEnvironmentProvider } from "../../../src/context/runtime"
import { Prompt } from "../../../src/component/prompt"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"
import { createEventSource, createFetch, directory, json } from "../../fixture/tui-sdk"
import { tmpdir } from "../../fixture/fixture"
import { FrecencyProvider } from "../../../src/prompt/frecency"
import { PromptHistoryProvider } from "../../../src/prompt/history"
import { PromptStashProvider } from "../../../src/prompt/stash"
import { MiaopanCodeKeymapProvider, registerMiaopanCodeKeymap } from "../../../src/keymap"
import { ThemeProvider } from "../../../src/context/theme"
import { ToastProvider } from "../../../src/ui/toast"
import { DialogProvider } from "../../../src/ui/dialog"
import { TuiConfigProvider } from "../../../src/config"
import { LocationProvider } from "../../../src/context/location"
import { useLocal } from "../../../src/context/local"
import { useSync } from "../../../src/context/sync"
import type { PromptRef } from "../../../src/component/prompt"

const sessionID = "ses_prompt_interrupt"

async function wait(fn: () => boolean, timeout = 2000) {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > timeout) throw new Error("timed out waiting for condition")
    await Bun.sleep(10)
  }
}

function global(payload: Event): GlobalEvent {
  return { directory, project: "proj_test", payload }
}

function status(sessionID: string, value: "busy" | "idle"): GlobalEvent {
  return global({
    id: `evt_${sessionID}_${value}`,
    type: "session.status",
    properties: { sessionID, status: { type: value } },
  })
}

async function mountPrompt(root: string) {
  const state = `${root}/state`
  await mkdir(state, { recursive: true })
  await Bun.write(`${state}/kv.json`, "{}")

  const events = createEventSource()
  let prompt!: PromptRef
  let keymap!: ReturnType<typeof createDefaultOpenTuiKeymap>
  let ready!: () => void
  const mounted = new Promise<void>((resolve) => {
    ready = resolve
  })
  let promptRequests = 0
  let abortRequests = 0
  const provider = {
    id: "test",
    name: "Test",
    source: "api",
    env: [],
    options: {},
    models: {
      model: {
        id: "model",
        providerID: "test",
        api: { id: "test", url: "http://test", npm: "test" },
        name: "Test Model",
        capabilities: {
          temperature: false,
          reasoning: false,
          attachment: false,
          toolcall: true,
          input: { text: true, audio: false, image: false, video: false, pdf: false },
          output: { text: true, audio: false, image: false, video: false, pdf: false },
          interleaved: false,
        },
        cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
        limit: { context: 100_000, output: 4096 },
        status: "active",
        options: {},
        headers: {},
        release_date: "2026-01-01",
      },
    },
  }
  const calls = createFetch((url) => {
    if (url.pathname === "/config/providers") return json({ providers: [provider], default: { test: "model" } })
    if (url.pathname === "/config") return json({ model: "test/model" })
    if (url.pathname === "/agent") return json([{ name: "build", mode: "primary", permission: {}, options: {} }])
    if (url.pathname === `/session/${sessionID}/message`) {
      promptRequests += 1
      return json({ data: {} })
    }
    if (url.pathname === `/session/${sessionID}/abort`) {
      abortRequests += 1
      return json(true)
    }
  }, events)
  const config = createTuiResolvedConfig()

  function Harness() {
    const renderer = useRenderer()
    keymap = createDefaultOpenTuiKeymap(renderer)
    const off = registerMiaopanCodeKeymap(keymap, renderer, config)
    onCleanup(off)

    function PromptFixture() {
      const sync = useSync()
      const local = useLocal()
      createEffect(() => {
        if (sync.ready && local.model.ready && local.agent.current() && local.model.current()) ready()
      })

      return (
        <Prompt
          sessionID={sessionID}
          ref={(value) => {
            if (!value) return
            prompt = value
            ready()
          }}
        />
      )
    }

    return (
      <TuiPathsProvider value={{ cwd: root, home: root, state, worktree: root }}>
        <TuiTerminalEnvironmentProvider value={{ platform: "linux" }}>
          <TuiStartupProvider value={{ skipInitialLoading: false }}>
            <ClipboardProvider value={{}}>
              <MiaopanCodeKeymapProvider keymap={keymap}>
                <ArgsProvider>
                  <KVProvider>
                    <ToastProvider>
                      <RouteProvider initialRoute={{ type: "session", sessionID }}>
                        <TuiConfigProvider config={config}>
                          <I18nProvider>
                            <SDKProvider
                              url="http://test"
                              directory={directory}
                              events={events.source}
                              fetch={calls.fetch}
                            >
                              <PermissionProvider>
                                <ProjectProvider>
                                  <ExitProvider exit={() => {}}>
                                    <SyncProvider>
                                      <DataProvider>
                                        <ThemeProvider mode="dark">
                                          <LocalProvider>
                                            <PromptStashProvider>
                                              <DialogProvider>
                                                <FrecencyProvider>
                                                  <PromptHistoryProvider>
                                                    <PromptQueueProvider>
                                                      <PromptRefProvider>
                                                        <EditorContextProvider
                                                          integration={{ connection: () => undefined }}
                                                        >
                                                          <LocationProvider location={{ directory }}>
                                                            <PromptFixture />
                                                          </LocationProvider>
                                                        </EditorContextProvider>
                                                      </PromptRefProvider>
                                                    </PromptQueueProvider>
                                                  </PromptHistoryProvider>
                                                </FrecencyProvider>
                                              </DialogProvider>
                                            </PromptStashProvider>
                                          </LocalProvider>
                                        </ThemeProvider>
                                      </DataProvider>
                                    </SyncProvider>
                                  </ExitProvider>
                                </ProjectProvider>
                              </PermissionProvider>
                            </SDKProvider>
                          </I18nProvider>
                        </TuiConfigProvider>
                      </RouteProvider>
                    </ToastProvider>
                  </KVProvider>
                </ArgsProvider>
              </MiaopanCodeKeymapProvider>
            </ClipboardProvider>
          </TuiStartupProvider>
        </TuiTerminalEnvironmentProvider>
      </TuiPathsProvider>
    )
  }

  const app = await testRender(() => <Harness />, { kittyKeyboard: true })
  await mounted
  prompt.reset()
  return {
    app,
    events,
    keymap,
    prompt,
    promptRequests: () => promptRequests,
    abortRequests: () => abortRequests,
  }
}

test("first escape aborts and restores the submitted prompt when the composer is empty", async () => {
  await using tmp = await tmpdir()
  const mounted = await mountPrompt(tmp.path)
  try {
    mounted.prompt.set({ input: "hello", parts: [] })
    mounted.prompt.submit()
    await wait(() => mounted.promptRequests() === 1)

    mounted.events.emit(status(sessionID, "busy"))
    await Bun.sleep(20)
    mounted.keymap.dispatchCommand("session.interrupt")
    await wait(() => mounted.abortRequests() === 1)

    expect(mounted.abortRequests()).toBe(1)
    expect(mounted.prompt.current.input).toBe("hello")

    mounted.keymap.dispatchCommand("session.interrupt")
    expect(mounted.abortRequests()).toBe(1)
    expect(mounted.prompt.current.input).toBe("hello")
  } finally {
    mounted.app.renderer.destroy()
  }
})

test("does not replace a new draft with the submitted prompt", async () => {
  await using tmp = await tmpdir()
  const mounted = await mountPrompt(tmp.path)
  try {
    mounted.prompt.set({ input: "hello", parts: [] })
    mounted.prompt.submit()
    await wait(() => mounted.promptRequests() === 1)

    mounted.events.emit(status(sessionID, "busy"))
    await Bun.sleep(20)
    mounted.prompt.set({ input: "new draft", parts: [] })
    mounted.keymap.dispatchCommand("session.interrupt")

    expect(mounted.abortRequests()).toBe(0)
    expect(mounted.prompt.current.input).toBe("new draft")

    mounted.keymap.dispatchCommand("session.interrupt")
    await wait(() => mounted.abortRequests() === 1)
    expect(mounted.abortRequests()).toBe(1)
    expect(mounted.prompt.current.input).toBe("new draft")
  } finally {
    mounted.app.renderer.destroy()
  }
})
