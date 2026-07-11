import { expect, test } from "bun:test"
import { t } from "@miaopan-code/core/i18n"
import { SessionCompaction } from "@miaopan-code/core/session/compaction"
import { maxStepsPrompt } from "@miaopan-code/core/session/runner/max-steps"

test("compaction prompt preserves detailed work state and relevant files", () => {
  const prompt = SessionCompaction.buildPrompt({ context: ["conversation history"], language: "en" })

  expect(prompt).toContain("## Work State\n### Completed")
  expect(prompt).toContain("### Active")
  expect(prompt).toContain("### Blocked")
  expect(prompt).toContain("## Relevant Files")
})

test("compaction prompt uses the requested language without changing its structure", () => {
  const prompt = SessionCompaction.buildPrompt({ context: ["对话历史"], language: "zh-CN" })

  expect(prompt).toContain("## 工作状态\n### 已完成")
  expect(prompt).toContain("### 进行中")
  expect(prompt).toContain("### 受阻")
  expect(prompt).toContain("## 相关文件")
})

test("compaction describes tool media without embedding base64", () => {
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"
  const content = [
    { type: "text" as const, text: "Image read successfully" },
    { type: "file" as const, uri: `data:image/png;base64,${base64}`, mime: "image/png", name: "pixel.png" },
    { type: "file" as const, uri: `data:image/png;base64,${base64}`, mime: "image/png" },
  ]
  const english = SessionCompaction.serializeToolContent(content, "en")
  const chinese = SessionCompaction.serializeToolContent(content, "zh-CN")

  expect(english).toBe("Image read successfully\n[Attached image/png: pixel.png]\n[Attached image/png]")
  expect(chinese).toBe("Image read successfully\n[已附加 image/png：pixel.png]\n[已附加 image/png]")
  expect(english).not.toContain(base64)
  expect(chinese).not.toContain(base64)
})

test("maximum steps prompt uses the requested language", () => {
  expect(maxStepsPrompt("zh-CN")).toBe(t("zh-CN", "prompt.max_steps_reached"))
  expect(maxStepsPrompt("en")).toBe(t("en", "prompt.max_steps_reached"))
})
