import { t, type Language, type MessageKey, type MessageParameters } from "@miaopan-code/core/i18n"
import { createSimpleContext } from "./helper"
import * as Locale from "../util/locale"

export const { use: useI18n, provider: I18nProvider } = createSimpleContext({
  name: "I18n",
  init: (props: { language?: Language }) => {
    Locale.setLanguage(props.language)

    const category = (value: string | undefined) => {
      if (!value) return value
      return Locale.category(value)
    }

    return {
      language: Locale.language,
      setLanguage: Locale.setLanguage,
      t(key: MessageKey, parameters?: MessageParameters) {
        return t(Locale.language(), key, parameters)
      },
      category,
    }
  },
})
