import { describe, expect, test } from "bun:test"
import { collapseToolText } from "../../src/util/collapse-tool-output"

describe("collapseToolText", () => {
  test("keeps text that fits on one line unchanged", () => {
    expect(collapseToolText("Read src/index.ts", 24)).toEqual({ text: "Read src/index.ts", overflow: false })
  })

  test("marks a long line with a space and three dots", () => {
    expect(collapseToolText("Read packages/miaopan-code/src/index.ts", 20)).toEqual({
      text: "Read packages/mi ...",
      overflow: true,
    })
  })

  test("collapses multiline content to its first line", () => {
    expect(collapseToolText("execute\n↳ Read src/index.ts", 40)).toEqual({ text: "execute ...", overflow: true })
  })

  test("keeps the marker within a very narrow width", () => {
    expect(collapseToolText("a long tool call", 4)).toEqual({ text: " ...", overflow: true })
  })

  test("measures wide characters without exceeding the width budget", () => {
    const collapsed = collapseToolText("读取很长的工具调用", 10)

    expect(collapsed).toEqual({ text: "读取很 ...", overflow: true })
    expect(Bun.stringWidth(collapsed.text)).toBeLessThanOrEqual(10)
  })
})
