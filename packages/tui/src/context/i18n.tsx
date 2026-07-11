import { resolveLanguage, t, type Language, type MessageKey, type MessageParameters } from "@miaopan-code/core/i18n"
import { createSignal } from "solid-js"
import { createSimpleContext } from "./helper"
import * as Locale from "../util/locale"

export const { use: useI18n, provider: I18nProvider } = createSimpleContext({
  name: "I18n",
  init: (props: { language?: Language }) => {
    const [language, setLanguage] = createSignal(resolveLanguage(props.language))
    Locale.setLanguage(props.language)

    const category = (value: string | undefined) => {
      if (!value) return value
      const key: Partial<Record<string, MessageKey>> = {
        System: "tui.category_system",
        Dialog: "tui.category_dialog",
        Question: "tui.category_question",
        Permission: "tui.category_permission",
        Prompt: "tui.category_prompt",
        VCS: "tui.category_vcs",
        Plugins: "tui.category_plugins",
        Skills: "tui.category_skills",
        Autocomplete: "tui.category_autocomplete",
      }
      const messageKey = key[value]
      return messageKey ? t(language(), messageKey) : value
    }

    return {
      language,
      setLanguage(input: unknown) {
        const next = resolveLanguage(input)
        Locale.setLanguage(next)
        setLanguage(next)
      },
      t(key: MessageKey, parameters?: MessageParameters) {
        return t(language(), key, parameters)
      },
      category,
    }
  },
})
