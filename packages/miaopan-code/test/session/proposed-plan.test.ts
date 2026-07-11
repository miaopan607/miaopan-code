import { describe, expect, test } from "bun:test"
import { ProposedPlan } from "../../src/session/proposed-plan"

function parse(chunks: string[]) {
  const parser = new ProposedPlan.Parser()
  return [...chunks.flatMap((chunk) => parser.push(chunk)), ...parser.finish()].reduce<ProposedPlan.Segment[]>(
    (segments, segment) => {
      const previous = segments.at(-1)
      if (previous?.type !== segment.type) return [...segments, segment]
      return [...segments.slice(0, -1), { type: segment.type, text: previous.text + segment.text }]
    },
    [],
  )
}

describe("proposed plan parser", () => {
  test("separates surrounding text from a proposed plan", () => {
    expect(parse(["Before\n<proposed_plan>\nStep one\n</proposed_plan>\nAfter"])).toEqual([
      { type: "text", text: "Before\n" },
      { type: "plan", text: "Step one\n" },
      { type: "text", text: "After" },
    ])
  })

  test("recognizes tags split across deltas", () => {
    expect(parse(["<proposed_", "plan>\nStep", " one\n</proposed_", "plan>"])).toEqual([
      { type: "plan", text: "Step one\n" },
    ])
  })

  test("keeps inline and malformed tags as ordinary text", () => {
    expect(parse(["Prefix <proposed_plan>\nStep\n</proposed-plan>"])).toEqual([
      { type: "text", text: "Prefix <proposed_plan>\nStep\n</proposed-plan>" },
    ])
  })

  test("supports multiple plan blocks in order", () => {
    expect(parse(["<proposed_plan>\nOne\n</proposed_plan>\nText\n<proposed_plan>\nTwo\n</proposed_plan>"])).toEqual([
      { type: "plan", text: "One\n" },
      { type: "text", text: "Text\n" },
      { type: "plan", text: "Two\n" },
    ])
  })

  test("flushes an unclosed plan at stream completion", () => {
    expect(parse(["<proposed_plan>\nIncomplete"])).toEqual([{ type: "plan", text: "Incomplete" }])
  })
})
