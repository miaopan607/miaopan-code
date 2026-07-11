import { describe, expect, test } from "bun:test"
import { fromAcceptLanguage } from "../src/i18n"

describe("Server i18n", () => {
  test("defaults to Simplified Chinese and accepts English language ranges", () => {
    expect(fromAcceptLanguage(undefined)).toBe("zh-CN")
    expect(fromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh-CN")
    expect(fromAcceptLanguage("en-US,en;q=0.9")).toBe("en")
    expect(fromAcceptLanguage("fr-FR,zh-CN;q=0.9")).toBe("zh-CN")
  })
})
