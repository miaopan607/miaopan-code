import { describe, expect, test } from "bun:test"
import { gpt5MinorVersion, gptVersion, isGpt56Plus } from "../../src/provider/model-id"
import { ProviderVariant } from "../../src/provider/variant"

describe("provider model IDs", () => {
  test("parses multi-digit GPT-5 minor versions", () => {
    expect(gpt5MinorVersion("openai/gpt-5.10-sol")).toBe(10)
    expect(gpt5MinorVersion("openai.gpt-5-6-terra")).toBe(6)
    expect(gpt5MinorVersion("gpt-50")).toBeUndefined()
  })

  test("parses later GPT major versions without treating them as GPT-5", () => {
    expect(gptVersion("gpt-6.0-codex")).toEqual({ major: 6, minor: 0 })
    expect(gpt5MinorVersion("gpt-6.0-codex")).toBeUndefined()
  })

  test("falls back to the configured model ID", () => {
    expect(isGpt56Plus({ id: "openai/gpt-5.6-sol", api: { id: "company-coder" } })).toBe(true)
  })
})

describe("provider variants", () => {
  test("strips miaopan-code metadata before provider options are sent", () => {
    expect(ProviderVariant.resolve({ reasoningEffort: "max", $miaopanCode: { mode: "ultra" } })).toEqual({
      mode: "ultra",
      options: { reasoningEffort: "max" },
    })
  })

  test("does not infer product Ultra from a variant name or native effort", () => {
    expect(ProviderVariant.resolve({ reasoningEffort: "ultra" })).toEqual({
      mode: undefined,
      options: { reasoningEffort: "ultra" },
    })
  })
})
