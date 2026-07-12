/** @jsxImportSource @opentui/solid */
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { testRender, useRenderer } from "@opentui/solid"
import { expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { onCleanup, onMount } from "solid-js"
import { DialogProvider, useDialog } from "../../../src/ui/dialog"
import { DialogPlanImplementation } from "../../../src/routes/session/dialog-plan-implementation"
import { KVProvider } from "../../../src/context/kv"
import { I18nProvider } from "../../../src/context/i18n"
import { ThemeProvider } from "../../../src/context/theme"
import { TuiConfigProvider } from "../../../src/config"
import { ToastProvider } from "../../../src/ui/toast"
import { MiaopanCodeKeymapProvider, registerMiaopanCodeKeymap } from "../../../src/keymap"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"
import { TestTuiContexts } from "../../fixture/tui-environment"
import { tmpdir } from "../../fixture/fixture"

async function mount(root: string, stale = false) {
  const state = path.join(root, "state")
  await mkdir(state, { recursive: true })
  await Bun.write(path.join(state, "kv.json"), "{}")

  const selected: string[] = []
  let keymap!: ReturnType<typeof createDefaultOpenTuiKeymap>
  let dialog!: ReturnType<typeof useDialog>
  let resolveMounted!: () => void
  const mounted = new Promise<void>((resolve) => {
    resolveMounted = resolve
  })

  function Launcher() {
    dialog = useDialog()
    onMount(() => {
      dialog.replace(() => <DialogPlanImplementation stale={stale} onSelect={(value) => selected.push(value)} />)
      resolveMounted()
    })
    return <box />
  }

  function Harness() {
    const renderer = useRenderer()
    keymap = createDefaultOpenTuiKeymap(renderer)
    const config = createTuiResolvedConfig({ leader_timeout: 1000 })
    const off = registerMiaopanCodeKeymap(keymap, renderer, config)
    onCleanup(off)

    return (
      <TestTuiContexts
        directory={root}
        paths={{
          home: root,
          state,
          worktree: root,
        }}
      >
        <MiaopanCodeKeymapProvider keymap={keymap}>
          <TuiConfigProvider config={config}>
            <KVProvider>
              <I18nProvider language="zh-CN">
                <ThemeProvider mode="dark">
                  <ToastProvider>
                    <DialogProvider>
                      <Launcher />
                    </DialogProvider>
                  </ToastProvider>
                </ThemeProvider>
              </I18nProvider>
            </KVProvider>
          </TuiConfigProvider>
        </MiaopanCodeKeymapProvider>
      </TestTuiContexts>
    )
  }

  const app = await testRender(() => <Harness />, { kittyKeyboard: true })
  await mounted
  await app.renderOnce()
  await app.waitFor(() => dialog.stack.length > 0)

  return {
    app,
    dialog,
    keymap,
    selected,
  }
}

test("plan implementation dialog returns each stable selection", async () => {
  await using tmp = await tmpdir()

  for (const [steps, expected] of [
    [0, "current"],
    [1, "fresh"],
    [2, "stay"],
  ] as const) {
    const mounted = await mount(tmp.path)
    try {
      for (let index = 0; index < steps; index++) mounted.keymap.dispatchCommand("dialog.select.next")
      mounted.keymap.dispatchCommand("dialog.select.submit")

      expect(mounted.selected).toEqual([expected])
      expect(mounted.dialog.stack).toHaveLength(0)
    } finally {
      mounted.app.renderer.destroy()
    }
  }
})

test("plan implementation dialog shows a warning for stale plans", async () => {
  await using tmp = await tmpdir()
  const mounted = await mount(tmp.path, true)
  try {
    expect(mounted.app.captureCharFrame()).toContain("警告")
  } finally {
    mounted.app.renderer.destroy()
  }
})
