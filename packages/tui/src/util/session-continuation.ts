import { SessionContinuation } from "@miaopan-code/core/v1/session-continuation"
import type { Message, Part } from "@miaopan/sdk/v2"

export type MessageWithParts = {
  info: Message
  parts: Part[]
}

function interrupted(part: Part) {
  if (part.type !== "tool") return false
  if (part.state.status === "pending" || part.state.status === "running") return true
  return part.state.status === "error" && part.state.metadata?.interrupted === true
}

function failed(message: MessageWithParts) {
  if (message.info.role !== "assistant") return false
  if (message.info.error || message.info.finish === "error") return true
  return message.parts.some(interrupted)
}

function structural(part: Part) {
  return (
    part.type === "step-start" ||
    part.type === "step-finish" ||
    part.type === "snapshot" ||
    part.type === "patch" ||
    part.type === "retry"
  )
}

function mergeParts(source: Part[], target: Part[], messageID: string) {
  const left = source.flatMap((part): Part[] => {
    if (structural(part) || (part.type === "tool" && interrupted(part))) return []
    return [{ ...part, messageID }]
  })
  if (left.length === 0) return target

  const right = target.map((part) => ({ ...part, messageID }))
  const first = right.findIndex((part) => !structural(part))
  const leftText = left.at(-1)
  const rightText = right[first]
  const joined =
    leftText?.type === "text" && rightText?.type === "text"
      ? [
          ...left.slice(0, -1),
          {
            ...leftText,
            messageID,
            text: leftText.text + rightText.text,
          },
          ...right.slice(first + 1),
        ]
      : [...left, ...right]

  return joined.reduce<Part[]>((parts, part) => {
    const previous = parts.at(-1)
    if (previous?.type === "text" && part.type === "text" && previous.synthetic !== true && part.synthetic !== true) {
      previous.text += part.text
      return parts
    }
    parts.push(part)
    return parts
  }, [])
}

export function projectContinuationMessages(input: MessageWithParts[]) {
  const continuation = SessionContinuation.resolve({
    attempts: input.flatMap((message) =>
      message.info.role === "assistant"
        ? [{ id: message.info.id, parentID: message.info.parentID, failed: failed(message) }]
        : [],
    ),
  })
  if (continuation.superseded.length === 0) return input

  const byID = new Map(input.map((message) => [message.info.id, message]))

  for (const [sourceID, targetID] of Object.entries(continuation.targetByAssistantID)) {
    const source = byID.get(sourceID)
    const target = byID.get(targetID)
    if (!source || !target || target.info.role !== "assistant") continue
    byID.set(targetID, {
      info: target.info,
      parts: mergeParts(source.parts, target.parts, target.info.id),
    })
  }

  const superseded = new Set(continuation.superseded)
  return input.flatMap((message) => (superseded.has(message.info.id) ? [] : [byID.get(message.info.id) ?? message]))
}
