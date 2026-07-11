import { afterEach, describe, expect, test } from "bun:test"
import { AccountRepoError, AccountServiceError, AccountTransportError } from "../../src/account/schema"
import { FormatError } from "../../src/cli/error"
import { UI } from "../../src/cli/ui"

afterEach(() => UI.setLanguage("zh-CN"))

describe("cli.error", () => {
  test("formats legacy and tagged config errors the same way", () => {
    const cases = [
      {
        tag: "ConfigJsonError",
        data: { path: "/tmp/miaopan-code.jsonc", message: "Unexpected token" },
        expected: "配置文件 /tmp/miaopan-code.jsonc 不是有效的 JSON(C): Unexpected token",
      },
      {
        tag: "ConfigDirectoryTypoError",
        data: { path: "/tmp/miaopan-code.jsonc", dir: ".miaopanCode", suggestion: "miaopan-code" },
        expected:
          "/tmp/miaopan-code.jsonc 中的目录“.miaopanCode”无效。请将目录重命名为“miaopan-code”或移除。这是常见拼写错误。",
      },
      {
        tag: "ConfigFrontmatterError",
        data: { path: "/tmp/AGENTS.md", message: "failed frontmatter" },
        expected: "failed frontmatter",
      },
      {
        tag: "ConfigInvalidError",
        data: {
          path: "/tmp/miaopan-code.jsonc",
          message: "schema mismatch",
          issues: [{ message: "Expected string", path: ["provider", "id"] }],
        },
        expected: "配置在 /tmp/miaopan-code.jsonc 处无效: schema mismatch\n↳ Expected string provider.id",
      },
    ]

    for (const item of cases) {
      expect(FormatError({ name: item.tag, data: item.data })).toBe(item.expected)
      expect(FormatError({ _tag: item.tag, ...item.data })).toBe(item.expected)
    }
  })

  test("preserves multiline JSONC diagnostics for tagged config errors", () => {
    const data = {
      path: "/tmp/miaopan-code.jsonc",
      message:
        '\n--- JSONC Input ---\n{\n  "model": \n}\n--- Errors ---\nValueExpected at line 3, column 1\n   Line 3: }\n          ^\n--- End ---',
    }
    const expected = `配置文件 ${data.path} 不是有效的 JSON(C): ${data.message}`

    expect(FormatError({ name: "ConfigJsonError", data })).toBe(expected)
    expect(FormatError({ _tag: "ConfigJsonError", ...data })).toBe(expected)
  })

  test("formats account transport errors clearly", () => {
    const error = new AccountTransportError({
      language: "zh-CN",
      method: "POST",
      url: "https://console.miaopanCode.ai/auth/device/code",
    })

    const formatted = FormatError(error)

    expect(formatted).toContain("无法访问 POST https://console.miaopanCode.ai/auth/device/code。")
    expect(formatted).toContain("此操作在服务器返回 HTTP 响应之前失败。")
    expect(formatted).toContain("请检查网络、代理或 VPN 配置后重试。")
  })

  test("formats account transport errors in their requested language", () => {
    const error = new AccountTransportError({
      language: "en",
      method: "POST",
      url: "https://console.miaopanCode.ai/auth/device/code",
    })

    const formatted = FormatError(error)

    expect(formatted).toContain("Could not reach POST https://console.miaopanCode.ai/auth/device/code.")
    expect(formatted).toContain("This failed before the server returned an HTTP response.")
    expect(formatted).toContain("Check your network, proxy, or VPN configuration and try again.")
  })

  test("formats account repository and service errors from typed keys", () => {
    expect(FormatError(new AccountRepoError({ language: "zh-CN" }))).toBe("数据库操作失败")
    expect(
      FormatError(new AccountServiceError({ language: "en", messageKey: "error.account_decode_response_failed" })),
    ).toBe("Failed to decode response")
  })

  test("formats legacy and tagged provider model errors the same way", () => {
    const data = {
      providerID: "anthropic",
      modelID: "claude-sonet-4",
      suggestions: ["claude-sonnet-4"],
    }
    const expected = [
      "未找到模型：anthropic/claude-sonet-4",
      "你是否想使用：claude-sonnet-4",
      "尝试：`miaopanCode models` 列出可用模型",
      "或检查配置文件（miaopan-code.json）中的提供商/模型名称",
    ].join("\n")

    expect(FormatError({ name: "ProviderModelNotFoundError", data })).toBe(expected)
    expect(FormatError({ _tag: "ProviderModelNotFoundError", ...data })).toBe(expected)
  })

  test("formats legacy and tagged provider init errors the same way", () => {
    const data = { providerID: "anthropic" }
    const expected = "无法初始化提供商“anthropic”。请检查凭据和配置。"

    expect(FormatError({ name: "ProviderInitError", data })).toBe(expected)
    expect(FormatError({ _tag: "ProviderInitError", ...data })).toBe(expected)
  })

  test("formats cancelled UI errors as empty output", () => {
    expect(FormatError(new UI.CancelledError())).toBe("")
  })

  test("formats errors in English when configured", () => {
    UI.setLanguage("en")
    expect(
      FormatError({
        name: "ConfigInvalidError",
        data: { path: "/tmp/miaopan-code.jsonc", message: "schema mismatch" },
      }),
    ).toBe("Configuration is invalid at /tmp/miaopan-code.jsonc: schema mismatch")
  })
})
