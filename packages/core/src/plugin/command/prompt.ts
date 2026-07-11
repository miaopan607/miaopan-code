import type { Language } from "../../i18n"
import INITIALIZE_EN from "./initialize.txt"
import INITIALIZE_ZH_CN from "./initialize.zh-CN.txt"
import REVIEW_EN from "./review.txt"
import REVIEW_ZH_CN from "./review.zh-CN.txt"

const messages = {
  initialize: { "zh-CN": INITIALIZE_ZH_CN, en: INITIALIZE_EN },
  review: { "zh-CN": REVIEW_ZH_CN, en: REVIEW_EN },
} as const

export type PromptKey = keyof typeof messages

export function text(language: Language | undefined, key: PromptKey) {
  return messages[key][language === "en" ? "en" : "zh-CN"]
}

export * as CommandPrompt from "./prompt"
