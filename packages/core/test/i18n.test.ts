import { expect, test } from "bun:test"
import { Config } from "@miaopan-code/core/config"
import { ConfigV1 } from "@miaopan-code/core/v1/config/config"
import { localizeKnownText, messages, resolveLanguage, t } from "@miaopan-code/core/i18n"
import { Schema } from "effect"

test("默认使用简体中文，并仅接受已支持的语言", () => {
  expect(resolveLanguage(undefined)).toBe("zh-CN")
  expect(resolveLanguage("en")).toBe("en")
  expect(resolveLanguage("fr")).toBe("zh-CN")
  expect(t(undefined, "tui.switch_language")).toBe("切换语言")
  expect(t("en", "tui.switch_language")).toBe("Switch language")
})

test("两代配置都接受 language 字段", () => {
  expect(Schema.decodeUnknownSync(ConfigV1.Info)({ language: "zh-CN" }).language).toBe("zh-CN")
  expect(Schema.decodeUnknownSync(Config.Info)({ language: "en" }).language).toBe("en")
})

test("可将已有 key 渲染结果切换到目标语言", () => {
  expect(localizeKnownText("en", t("zh-CN", "error.tool_unknown", { name: "bash" }))).toBe("Unknown tool: bash")
  expect(localizeKnownText("zh-CN", t("en", "error.tool_unknown", { name: "bash" }))).toBe("未知工具：bash")
  expect(localizeKnownText("en", "unmanaged provider text")).toBe("unmanaged provider text")
})

test("每个 i18n key 都包含中文和英文资源", () => {
  for (const [key, message] of Object.entries(messages)) {
    expect(typeof message["zh-CN"]).toBe("string")
    expect(typeof message.en).toBe("string")
    expect(message["zh-CN"].length).toBeGreaterThan(0)
    expect(message.en.length).toBeGreaterThan(0)
    expect(t("zh-CN", key as keyof typeof messages)).not.toBe(key)
  }
})
