import { createMemo } from "solid-js"
import { useKV } from "./kv"

export type ThinkingMode = "expanded" | "collapsed" | "hidden"

const MODES: readonly ThinkingMode[] = ["collapsed", "expanded", "hidden"] as const

// OpenAI's Responses API surfaces reasoning summaries that start with a bolded
// title block: "**Inspecting PR workflow**\n\n<body>". Treat that first block,
// or a complete title still awaiting its body while streaming, as disclosure
// metadata so the TUI can style its header independently from the markdown body.
export function reasoningSummary(text: string) {
  const content = text.trim()
  const match = content.match(/^\*\*([^*\n]+)\*\*(?:\r?\n\r?\n|$)/)
  if (!match) return { title: null, body: content }
  return { title: match[1].trim(), body: content.slice(match[0].length).trimEnd() }
}

export function isThinkingMode(value: unknown): value is ThinkingMode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value)
}

export function useThinkingMode() {
  const kv = useKV()
  // Capture pre-state before `kv.signal` seeds a default, so we can detect
  // first-time users with a legacy `thinking_visibility` boolean and migrate.
  // The KVProvider only renders children once kv.ready, so reads here are safe.
  const hadStored = kv.get("thinking_mode") !== undefined
  const legacy = kv.get("thinking_visibility")
  const [stored, setStored] = kv.signal<ThinkingMode | "show" | "hide" | "minimal">("thinking_mode", "hidden")

  const set = (next: ThinkingMode) => setStored(() => next)

  // Preserve previous experience for users who had explicitly toggled the
  // legacy `thinking_visibility` boolean. First-time users (no legacy key)
  // get the new hidden default.
  if (!hadStored) {
    if (legacy === true) set("expanded")
    else if (legacy === false) set("hidden")
  }

  if (stored() === "show") set("expanded")
  if (stored() === "hide") set("hidden")
  if (stored() === "minimal") set("collapsed")

  const mode = createMemo<ThinkingMode>(() => {
    const value = stored()
    return isThinkingMode(value) ? value : "hidden"
  })

  return {
    mode,
    set,
  }
}
