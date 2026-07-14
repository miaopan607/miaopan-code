/** @jsxImportSource @opentui/solid */
import { InputRenderable } from "@opentui/core"
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { testRender, useRenderer, type JSX } from "@opentui/solid"
import { expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { onCleanup, onMount } from "solid-js"
import { TuiConfigProvider } from "../../../src/config"
import { ClipboardProvider } from "../../../src/context/clipboard"
import { I18nProvider } from "../../../src/context/i18n"
import { KVProvider } from "../../../src/context/kv"
import { ThemeProvider } from "../../../src/context/theme"
import { MiaopanCodeKeymapProvider, registerMiaopanCodeKeymap } from "../../../src/keymap"
import { DialogProvider, useDialog } from "../../../src/ui/dialog"
import { DialogSelect, type DialogSelectOption } from "../../../src/ui/dialog-select"
import { ToastProvider } from "../../../src/ui/toast"
import { tmpdir } from "../../fixture/fixture"
import { TestTuiContexts } from "../../fixture/tui-environment"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"

async function wait(fn: () => boolean, timeout = 2000) {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > timeout) throw new Error("timed out waiting for condition")
    await Bun.sleep(10)
  }
}

async function mount(
  root: string,
  input: {
    options: DialogSelectOption<string>[]
    emptyView?: string | number | (() => JSX.Element)
  },
) {
  const state = path.join(root, "state")
  await mkdir(state, { recursive: true })
  await Bun.write(path.join(state, "kv.json"), "{}")

  const selected: string[] = []
  let dialog!: ReturnType<typeof useDialog>
  let resolveMounted!: () => void
  const mounted = new Promise<void>((resolve) => {
    resolveMounted = resolve
  })

  function Launcher() {
    dialog = useDialog()
    onMount(() => {
      dialog.replace(() => (
        <DialogSelect
          title="dialog-select"
          options={input.options}
          emptyView={typeof input.emptyView === "function" ? input.emptyView() : input.emptyView}
          onSelect={(option) => selected.push(option.value)}
        />
      ))
      resolveMounted()
    })
    return <box />
  }

  function Harness() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    const config = createTuiResolvedConfig({ leader_timeout: 1000 })
    const off = registerMiaopanCodeKeymap(keymap, renderer, config)
    onCleanup(off)

    return (
      <TestTuiContexts directory={root} paths={{ home: root, state, worktree: root }}>
        <MiaopanCodeKeymapProvider keymap={keymap}>
          <TuiConfigProvider config={config}>
            <KVProvider>
              <I18nProvider language="zh-CN">
                <ThemeProvider mode="dark" source={{ discover: async () => ({}) }}>
                  <ClipboardProvider value={{}}>
                    <ToastProvider>
                      <DialogProvider>
                        <Launcher />
                      </DialogProvider>
                    </ToastProvider>
                  </ClipboardProvider>
                </ThemeProvider>
              </I18nProvider>
            </KVProvider>
          </TuiConfigProvider>
        </MiaopanCodeKeymapProvider>
      </TestTuiContexts>
    )
  }

  const app = await testRender(() => <Harness />, { width: 80, height: 24, kittyKeyboard: true })
  await mounted
  await app.renderOnce()
  await app.waitFor(() => dialog.stack.length > 0)
  await wait(() => app.renderer.currentFocusedEditor instanceof InputRenderable)

  return { app, dialog, selected }
}

test("renders a text empty view while filtering and restores selectable options", async () => {
  await using tmp = await tmpdir()
  const mounted = await mount(tmp.path, {
    options: [{ title: "option-a", value: "option-a" }],
    emptyView: "empty-state",
  })

  try {
    await mounted.app.waitForFrame((frame) => frame.includes("option-a"))
    await mounted.app.mockInput.typeText("zzz")

    const emptyFrame = await mounted.app.waitForFrame((frame) => frame.includes("empty-state"))
    expect(emptyFrame).not.toContain("option-a")

    mounted.app.mockInput.pressBackspace()
    mounted.app.mockInput.pressBackspace()
    mounted.app.mockInput.pressBackspace()

    const restoredFrame = await mounted.app.waitForFrame((frame) => frame.includes("option-a"))
    expect(restoredFrame).not.toContain("empty-state")

    mounted.app.mockInput.pressEnter()
    expect(mounted.selected).toEqual(["option-a"])
  } finally {
    mounted.app.renderer.destroy()
  }
})

test.each(["escape", "ctrl+c"] as const)("closes a text empty view with %s", async (key) => {
  await using tmp = await tmpdir()
  const mounted = await mount(tmp.path, {
    options: [{ title: "option-a", value: "option-a" }],
    emptyView: "empty-state",
  })

  try {
    await mounted.app.mockInput.typeText("zzz")
    await mounted.app.waitForFrame((frame) => frame.includes("empty-state"))

    if (key === "escape") mounted.app.mockInput.pressEscape()
    if (key === "ctrl+c") mounted.app.mockInput.pressCtrlC()

    await mounted.app.waitFor(() => mounted.dialog.stack.length === 0)
  } finally {
    mounted.app.renderer.destroy()
  }
})

test("renders a text empty view for initially empty options", async () => {
  await using tmp = await tmpdir()
  const mounted = await mount(tmp.path, { options: [], emptyView: "initial-empty" })

  try {
    expect(await mounted.app.waitForFrame((frame) => frame.includes("initial-empty"))).toContain("initial-empty")
  } finally {
    mounted.app.renderer.destroy()
  }
})

test("preserves a structured JSX empty view", async () => {
  await using tmp = await tmpdir()
  const mounted = await mount(tmp.path, {
    options: [],
    emptyView: () => (
      <box id="structured-empty" paddingLeft={1}>
        <text>structured-empty</text>
      </box>
    ),
  })

  try {
    expect(await mounted.app.waitForFrame((frame) => frame.includes("structured-empty"))).toContain("structured-empty")
    expect(mounted.app.renderer.root.findDescendantById("structured-empty")).toBeDefined()
  } finally {
    mounted.app.renderer.destroy()
  }
})
