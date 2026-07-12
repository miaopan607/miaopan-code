import { describe, expect, test } from "bun:test"
import { t } from "@miaopan-code/core/i18n"
import { normalizeCustomProviderID, providerOptions } from "../../../../src/component/dialog-provider"

describe("providerOptions", () => {
  test("includes a synthetic Other option for custom providers", () => {
    expect(providerOptions([{ id: "openai", name: "OpenAI" }]).at(-1)).toMatchObject({
      title: t("zh-CN", "dialog.other"),
      description: t("zh-CN", "provider.custom"),
      category: t("zh-CN", "provider.providers"),
    })
  })

  test("does not use Other as the generic provider category", () => {
    expect(providerOptions([{ id: "mistral", name: "Mistral" }])[0]?.category).toBe(t("zh-CN", "provider.providers"))
  })

  test("keeps popular providers first and sorts the rest alphabetically", () => {
    expect(
      providerOptions([
        { id: "openai", name: "OpenAI" },
        { id: "custom-z", name: "Zebra Provider" },
        { id: "anthropic", name: "Anthropic" },
        { id: "mistral", name: "Mistral" },
        { id: "aws", name: "AWS Bedrock" },
      ]).map((option) => option.value),
    ).toEqual(["openai", "anthropic", "aws", "mistral", "custom-z", "__miaopan_code_custom_provider__"])
  })

  test("puts OpenCode Zen and Go first with their service descriptions", () => {
    const options = providerOptions([
      { id: "openai", name: "OpenAI" },
      { id: "opencode-go", name: "OpenCode Go" },
      { id: "opencode", name: "OpenCode Zen" },
    ])

    expect(options.slice(0, 3).map((option) => option.value)).toEqual(["opencode", "opencode-go", "openai"])
    expect(options[0]?.description).toBe(t("zh-CN", "provider.recommended"))
    expect(options[1]?.description).toBe(t("zh-CN", "provider.low_cost"))
  })

  test("does not collide with a configured provider named other", () => {
    const values = providerOptions([{ id: "other", name: "Other Provider" }]).map((option) => option.value)
    expect(new Set(values).size).toBe(values.length)
  })

  test("normalizes and validates custom provider ids", () => {
    expect(normalizeCustomProviderID("  custom-provider  ")).toBe("custom-provider")
    expect(normalizeCustomProviderID("custom_provider")).toBe("custom_provider")
    expect(normalizeCustomProviderID("@ai-sdk/custom-provider")).toBe("custom-provider")
    expect(normalizeCustomProviderID("-custom-provider")).toBeUndefined()
    expect(normalizeCustomProviderID("Custom Provider")).toBeUndefined()
  })
})
