import { describe, expect, test } from "bun:test"
import { t } from "@miaopan-code/core/i18n"
import { AzureAuthPlugin } from "../../src/plugin/azure"
import { CloudflareWorkersAuthPlugin } from "../../src/plugin/cloudflare"
import { CopilotAuthPlugin } from "../../src/plugin/github-copilot/copilot"
import { CodexAuthPlugin, renderOAuthError } from "../../src/plugin/openai/codex"
import { readPluginId } from "../../src/plugin/shared"
import { SnowflakeCortexAuthPlugin } from "../../src/plugin/snowflake-cortex"
import { XaiAuthPlugin } from "../../src/plugin/xai"
import { OpenAIWebSocket } from "../../src/plugin/openai/ws"
import { createServer } from "node:http"

describe("plugin i18n", () => {
  test("auth methods default to Simplified Chinese and accept explicit English", async () => {
    const input = {} as never
    const pairs = await Promise.all([
      Promise.all([AzureAuthPlugin(input), AzureAuthPlugin(input, { language: "en" })]),
      Promise.all([CloudflareWorkersAuthPlugin(input), CloudflareWorkersAuthPlugin(input, { language: "en" })]),
      Promise.all([CopilotAuthPlugin(input), CopilotAuthPlugin(input, { language: "en" })]),
      Promise.all([CodexAuthPlugin(input), CodexAuthPlugin(input, { language: "en" })]),
      Promise.all([SnowflakeCortexAuthPlugin(input), SnowflakeCortexAuthPlugin(input, { language: "en" })]),
      Promise.all([XaiAuthPlugin(input), XaiAuthPlugin(input, { language: "en" })]),
    ])

    for (const [chinese, english] of pairs) {
      expect(chinese.auth!.methods[0]!.label).not.toBe(english.auth!.methods[0]!.label)
    }

    expect(pairs[0][0].auth!.methods[0]!.label).toBe(t("zh-CN", "plugin.api_key"))
    expect(pairs[0][1].auth!.methods[0]!.label).toBe(t("en", "plugin.api_key"))
    expect(pairs[2][0].auth!.methods[0]!.label).toBe(t("zh-CN", "plugin.github.login_copilot"))
    expect(pairs[2][1].auth!.methods[0]!.label).toBe(t("en", "plugin.github.login_copilot"))
    expect(pairs[5][0].auth!.methods[0]!.label).toBe(t("zh-CN", "plugin.xai.oauth_subscription"))
    expect(pairs[5][1].auth!.methods[0]!.label).toBe(t("en", "plugin.xai.oauth_subscription"))
  })

  test("validation, loader errors, and OAuth pages use the selected language", async () => {
    const chinese = await SnowflakeCortexAuthPlugin({} as never)
    const english = await SnowflakeCortexAuthPlugin({} as never, { language: "en" })
    const chinesePrompt = chinese.auth!.methods[0]!.prompts![0]!
    const englishPrompt = english.auth!.methods[0]!.prompts![0]!

    expect(chinesePrompt.type).toBe("text")
    expect(englishPrompt.type).toBe("text")
    expect((chinesePrompt as Extract<typeof chinesePrompt, { type: "text" }>).validate!("")).toBe(
      t("zh-CN", "provider.required"),
    )
    expect((englishPrompt as Extract<typeof englishPrompt, { type: "text" }>).validate!("")).toBe(
      t("en", "provider.required"),
    )

    expect(() => readPluginId(42, "demo")).toThrow(t("zh-CN", "error.plugin_id_type", { spec: "demo", type: "number" }))
    expect(() => readPluginId(42, "demo", "en")).toThrow(
      t("en", "error.plugin_id_type", { spec: "demo", type: "number" }),
    )

    expect(renderOAuthError("detail")).toContain('<html lang="zh-CN">')
    expect(renderOAuthError("detail", "en")).toContain('<html lang="en">')
  })

  test("WebSocket diagnostics default to Chinese and accept explicit English", async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address()
    if (!address || typeof address === "string") return
    const url = `ws://127.0.0.1:${address.port}`

    try {
      await expect(OpenAIWebSocket.connectResponsesWebSocket({ url, headers: {}, timeout: 10 })).rejects.toThrow(
        t("zh-CN", "error.websocket_timeout"),
      )
      await expect(
        OpenAIWebSocket.connectResponsesWebSocket({ url, headers: {}, timeout: 10, language: "en" }),
      ).rejects.toThrow(t("en", "error.websocket_timeout"))
    } finally {
      server.close()
    }
  })
})
