export * as Review from "./review"

import { Option, Schema } from "effect"
import { t, type Language } from "@miaopan-code/core/i18n"

const CodeLocation = Schema.Struct({
  absolute_file_path: Schema.String,
  line_range: Schema.Struct({
    start: Schema.Int,
    end: Schema.Int,
  }),
})

const Finding = Schema.Struct({
  title: Schema.String,
  body: Schema.String,
  confidence_score: Schema.Finite,
  priority: Schema.Int,
  code_location: CodeLocation,
})

const Output = Schema.Struct({
  findings: Schema.Array(Finding),
  overall_correctness: Schema.String,
  overall_explanation: Schema.String,
  overall_confidence_score: Schema.Finite,
})
type Output = typeof Output.Type

const decodeJson = Schema.decodeUnknownOption(Schema.UnknownFromJsonString)
const decodeOutput = Schema.decodeUnknownOption(Output)

export function parseOutput(text: string): Output {
  const direct = decodeJson(text).pipe(Option.flatMap(decodeOutput), Option.getOrUndefined)
  if (direct) return direct

  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start >= 0 && end > start) {
    const embedded = decodeJson(text.slice(start, end + 1)).pipe(
      Option.flatMap(decodeOutput),
      Option.getOrUndefined,
    )
    if (embedded) return embedded
  }
  return {
    findings: [],
    overall_correctness: "",
    overall_explanation: text,
    overall_confidence_score: 0,
  }
}

export function isBuiltinCommand(
  command: string | undefined,
  config: { review_mode?: string; command?: Record<string, unknown> },
) {
  return command === "review" && config.review_mode !== "opencode" && !config.command?.review
}

export function renderOutput(output: Output, language: Language | undefined) {
  const explanation = output.overall_explanation.trim()
  const findings = output.findings.length
    ? [
        t(language, output.findings.length > 1 ? "review.full_comments" : "review.comment"),
        ...output.findings.flatMap((finding) => [
          `- ${finding.title} — ${finding.code_location.absolute_file_path}:${finding.code_location.line_range.start}-${finding.code_location.line_range.end}`,
          ...finding.body.split("\n").map((line) => `  ${line}`),
        ]),
      ].join("\n\n")
    : ""
  return [explanation, findings].filter((section) => section.length > 0).join("\n\n") || t(language, "review.fallback")
}
