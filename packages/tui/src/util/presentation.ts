import { t } from "@miaopan-code/core/i18n"
import { Locale } from "./locale"

const reset = "\x1b[0m"
const bold = "\x1b[1m"
const dim = "\x1b[90m"

export function sessionEpilogue(input: { title: string; sessionID?: string }) {
  const weak = (text: string) => `${dim}${text.padEnd(10, " ")}${reset}`
  return [
    `  ${weak(t(Locale.language(), "tui.session_label"))}${bold}${input.title}${reset}`,
    `  ${weak(t(Locale.language(), "tui.continue_label"))}${bold}miaopanCode -s ${input.sessionID}${reset}`,
    "",
  ].join("\n")
}
