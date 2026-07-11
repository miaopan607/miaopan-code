import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { Review } from "../src/review"
import { ConfigV1 } from "@miaopan-code/core/v1/config/config"

const output = {
  findings: [
    {
      title: "[P1] Keep the retry guard",
      body: "Retries can otherwise loop forever.",
      confidence_score: 0.98,
      priority: 1,
      code_location: {
        absolute_file_path: "/repo/src/retry.ts",
        line_range: { start: 12, end: 14 },
      },
    },
  ],
  overall_correctness: "patch is incorrect",
  overall_explanation: "The retry path can loop indefinitely.",
  overall_confidence_score: 0.95,
}

describe("Review", () => {
  test("parses complete and embedded JSON output", () => {
    expect(Review.parseOutput(JSON.stringify(output))).toEqual(output)
    expect(Review.parseOutput(`Here is the result:\n${JSON.stringify(output)}\n`)).toEqual(output)
  })

  test("falls back to a displayable explanation for invalid output", () => {
    expect(Review.parseOutput("The model could not produce JSON.")).toMatchObject({
      findings: [],
      overall_explanation: "The model could not produce JSON.",
    })
  })

  test("renders the explanation and finding locations", () => {
    expect(Review.renderOutput(output, "en")).toContain("The retry path can loop indefinitely.")
    expect(Review.renderOutput(output, "en")).toContain("/repo/src/retry.ts:12-14")
    expect(Review.renderOutput(output, undefined)).toContain("审查意见")
  })

  test("accepts both review modes in the V1 config schema", () => {
    for (const mode of ["codex", "opencode"] as const) {
      expect(Schema.decodeUnknownSync(ConfigV1.Info)({ review_mode: mode }).review_mode).toBe(mode)
    }
  })

  test("rejects invalid review modes", () => {
    expect(() => Schema.decodeUnknownSync(ConfigV1.Info)({ review_mode: "legacy" })).toThrow()
  })
})
