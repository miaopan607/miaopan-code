import { t } from "@miaopan-code/core/i18n"
import { Locale } from "./locale"

export function webSearchProviderLabel(provider: unknown) {
  if (provider === "parallel") return t(Locale.language(), "tui.web_search_parallel")
  if (provider === "exa") return t(Locale.language(), "tui.web_search_exa")
  return t(Locale.language(), "tui.web_search")
}

export function toolDisplayMetadata(state: unknown): Record<string, unknown> {
  if (!state || typeof state !== "object" || Array.isArray(state)) return {}
  if (!("status" in state) || state.status === "pending") return {}
  if (!("structured" in state) || !state.structured || typeof state.structured !== "object") return {}
  if (Array.isArray(state.structured)) return {}
  return state.structured as Record<string, unknown>
}
