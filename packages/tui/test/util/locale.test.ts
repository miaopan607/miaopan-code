import { describe, expect, test } from "bun:test"
import { createMemo, createRoot } from "solid-js"
import { category, language, number, setLanguage } from "../../src/util/locale"

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

  test.each(["zh-CN", "en"] as const)("%s 使用英文缩写格式化 token 数量", (locale) => {
    setLanguage(locale)

    expect(number(999)).toBe("999")
    expect(number(1_000)).toBe("1.0K")
    expect(number(128_000)).toBe("128.0K")
    expect(number(70_000_000)).toBe("70.0M")
  })
})
