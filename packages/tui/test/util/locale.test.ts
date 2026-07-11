import { describe, expect, test } from "bun:test"
import { createMemo, createRoot } from "solid-js"
import { category, language, setLanguage } from "../../src/util/locale"

describe("locale", () => {
  test("语言切换会更新响应式消费者", () => {
    createRoot((dispose) => {
      try {
        setLanguage("zh-CN")
        const current = createMemo(language)
        const translated = createMemo(() => category("System"))

        expect(current()).toBe("zh-CN")
        const chinese = translated()
        setLanguage("en")
        expect(current()).toBe("en")
        expect(translated()).not.toBe(chinese)
      } finally {
        dispose()
      }
    })
  })
})
