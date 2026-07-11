export type Segment = { readonly type: "text" | "plan"; readonly text: string }
type PendingSegment = { readonly type: Segment["type"]; readonly lines: string[] }

const OPEN_TAG = "<proposed_plan>"
const CLOSE_TAG = "</proposed_plan>"

export class Parser {
  private buffer = ""
  private plan = false

  push(chunk: string) {
    this.buffer += chunk
    const lastNewline = this.buffer.lastIndexOf("\n")
    if (lastNewline === -1) return []

    const complete = this.buffer.slice(0, lastNewline + 1)
    this.buffer = this.buffer.slice(lastNewline + 1)
    const segments: PendingSegment[] = []
    let start = 0
    while (start < complete.length) {
      const end = complete.indexOf("\n", start) + 1
      this.line(complete.slice(start, end), segments)
      start = end
    }
    return segments.map((segment) => ({ type: segment.type, text: segment.lines.join("") }))
  }

  finish() {
    const segments: PendingSegment[] = []
    if (this.buffer) this.line(this.buffer, segments)
    this.buffer = ""
    this.plan = false
    return segments.map((segment) => ({ type: segment.type, text: segment.lines.join("") }))
  }

  private line(line: string, segments: PendingSegment[]) {
    const marker = line.replace(/\r?\n$/, "").trim()
    if (!this.plan && marker === OPEN_TAG) {
      this.plan = true
      return
    }
    if (this.plan && marker === CLOSE_TAG) {
      this.plan = false
      return
    }
    const type = this.plan ? "plan" : "text"
    const previous = segments.at(-1)
    if (previous?.type === type) {
      previous.lines.push(line)
      return
    }
    segments.push({ type, lines: [line] })
  }
}

export * as ProposedPlan from "./proposed-plan"
