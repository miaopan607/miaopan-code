/** @jsxImportSource @opentui/solid */
import { RGBA } from "@opentui/core"
import { testRender } from "@opentui/solid"
import { describe, expect, test } from "bun:test"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { KVProvider } from "../../../src/context/kv"
import { ThemeProvider } from "../../../src/context/theme"
import { TuiConfigProvider } from "../../../src/config"
import { CodexStatus } from "../../../src/component/prompt"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"
import { TestTuiContexts } from "../../fixture/tui-environment"
import { tmpdir } from "../../fixture/fixture"

async function renderStatus(props: { animationsEnabled: boolean; elapsed: number; retryText?: string }) {
  await using tmp = await tmpdir()
  const state = path.join(tmp.path, "state")
  await mkdir(state, { recursive: true })
  await Bun.write(path.join(state, "kv.json"), "{}")

  const app = await testRender(
    () => (
      <TestTuiContexts paths={{ state }}>
        <TuiConfigProvider config={createTuiResolvedConfig()}>
          <KVProvider>
            <ThemeProvider mode="dark">
              <CodexStatus
                elapsed={props.elapsed}
                model="DeepSeek V4 Flash Free"
                color={RGBA.fromHex("#ffffff")}
                animationsEnabled={props.animationsEnabled}
                interruptShortcut="esc"
                interruptText="中断"
                retryText={props.retryText}
                onRetryClick={() => {}}
              />
            </ThemeProvider>
          </KVProvider>
        </TuiConfigProvider>
      </TestTuiContexts>
    ),
    { width: 80, height: 3 },
  )

  try {
    await app.renderOnce()
    await new Promise((resolve) => setTimeout(resolve, 25))
    await app.renderOnce()
    for (let attempt = 0; attempt < 20; attempt++) {
      const frame = app.captureCharFrame()
      if (frame.trim().length > 0) return frame.trim()
      await new Promise((resolve) => setTimeout(resolve, 25))
      await app.renderOnce()
    }
    return app.captureCharFrame().trim()
  } finally {
    app.renderer.destroy()
  }
}

describe("Codex status indicator", () => {
  test("uses the Codex layout and compact elapsed time without animation", async () => {
    const frame = await renderStatus({ animationsEnabled: false, elapsed: 61 })

    expect(frame).toMatch(/(?:工作中|Working) \(1m 01s · DeepSeek V4 Flash Free · esc 中断\)/)
    expect(frame).not.toContain("◦")
  })

  test("uses a single Codex-style bullet when animation is enabled", async () => {
    const frame = await renderStatus({ animationsEnabled: true, elapsed: 0 })

    expect(frame).toMatch(/[•◦]/)
  })

  test("keeps retry details after the working status", async () => {
    const frame = await renderStatus({ animationsEnabled: false, elapsed: 3600, retryText: "请求失败" })

    expect(frame).toMatch(/(?:工作中|Working) \(1h 00m 00s · DeepSeek V4 Flash Free · esc 中断\)/)
    expect(frame).toContain("· 请求失败")
  })
})
