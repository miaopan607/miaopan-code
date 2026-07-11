/** @jsxImportSource @opentui/solid */
import { beforeEach, describe, expect, test } from "bun:test"
import type { AssistantMessage } from "@miaopan/sdk/v2"
import { testRender } from "@opentui/solid"
import { formatTokens, SidebarContextView } from "../../../src/feature-plugins/sidebar/context"
import { Locale } from "../../../src/util/locale"
import { createTuiPluginApi } from "../../fixture/tui-plugin"

beforeEach(() => {
  Locale.setLanguage("zh-CN")
})

describe("sidebar context", () => {
  test("formats token usage with compact units", () => {
    expect(formatTokens(12_345, 128_000)).toBe("12.3K / 128K")
    expect(formatTokens(1_000, 1_000_000)).toBe("1K / 1M")
  })

  test("renders used tokens and the context window", async () => {
    const api = createApi(128_000)
    const app = await testRender(() => <SidebarContextView api={api} session_id="session" />, {
      width: 40,
      height: 6,
    })

    try {
      await app.renderOnce()
      await app.renderOnce()
      const frame = app.captureCharFrame()
      expect(frame).toContain("12.3K / 128K")
      expect(frame).toContain("10% 已使用")
    } finally {
      app.renderer.destroy()
    }
  })

  test("omits an unavailable context window", async () => {
    for (const context of [0, undefined]) {
      const api = createApi(context)
      const app = await testRender(() => <SidebarContextView api={api} session_id="session" />, {
        width: 40,
        height: 6,
      })

      try {
        await app.renderOnce()
        await app.renderOnce()
        const frame = app.captureCharFrame()
        expect(frame).toContain("12.3K")
        expect(frame).not.toContain("12.3K /")
      } finally {
        app.renderer.destroy()
      }
    }
  })
})

function createApi(context?: number) {
  const message = {
    id: "message",
    sessionID: "session",
    role: "assistant",
    time: { created: 0 },
    parentID: "parent",
    modelID: "model",
    providerID: "provider",
    agent: "build",
    mode: "build",
    path: { cwd: "/workspace", root: "/workspace" },
    cost: 0,
    tokens: {
      input: 10_000,
      output: 2_000,
      reasoning: 300,
      cache: { read: 45, write: 0 },
    },
  } satisfies AssistantMessage
  const api = createTuiPluginApi({
    state: {
      session: {
        get: () => undefined,
        messages: () => [message],
      },
    },
  })
  Object.assign(api.state, {
    provider:
      context === undefined
        ? []
        : [
            {
              id: "provider",
              models: {
                model: {
                  limit: { context },
                },
              },
            },
          ],
  })
  return api
}
