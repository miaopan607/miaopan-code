import { resolveLanguage } from "@miaopan-code/core/i18n"

export function pluginLanguage(options: unknown) {
  if (!options || typeof options !== "object" || !("language" in options)) return resolveLanguage(undefined)
  return resolveLanguage(options.language)
}
