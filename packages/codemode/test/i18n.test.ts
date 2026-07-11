import { describe, expect, test } from "bun:test"
import { CodeMode, I18n } from "../src/index.js"
import { annotateLanguage, formatLocation, unsupportedSyntax, type AstNode } from "../src/interpreter/model.js"

describe("CodeMode i18n", () => {
  test("every key has non-empty Simplified Chinese and English values", () => {
    for (const [key, value] of Object.entries(I18n.messages)) {
      expect(value["zh-CN"].trim(), `${key} zh-CN`).not.toBe("")
      expect(value.en.trim(), `${key} en`).not.toBe("")
    }
  })

  test("defaults to Simplified Chinese and supports English instructions", () => {
    expect(CodeMode.make().instructions()).toContain("当前没有可用工具")
    expect(CodeMode.make({ language: "en" }).instructions()).toContain("No tools are currently available")
  })

  test("unknown languages fall back to Simplified Chinese", () => {
    expect(I18n.resolveLanguage("fr")).toBe("zh-CN")
    expect(I18n.t(undefined, "codemode.error.code_empty")).toBe("代码不能为空。")
  })

  test("AST nodes inherit the selected language without enumerable metadata", () => {
    const child: AstNode = {
      type: "Identifier",
      loc: { start: { line: 3, column: 6 }, end: { line: 3, column: 7 } },
    }
    const root: AstNode = { type: "Program", child }
    annotateLanguage(root, "en")

    expect(Object.keys(root)).toEqual(["type", "child"])
    expect(formatLocation(child)).toBe(" (line 2, col 3)")
    expect(unsupportedSyntax("ClassDeclaration", child).message).toStartWith(
      "Syntax 'ClassDeclaration' is not supported in CodeMode.",
    )
  })
})
