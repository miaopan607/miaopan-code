import { EOL } from "os"
import { Schema } from "effect"
import {
  I18n,
  resolveLanguage,
  type Language,
  type MessageKey,
  type MessageParameters,
} from "@miaopan-code/core/i18n"
import { Global } from "@miaopan-code/core/global"
import { existsSync } from "fs"
import { parse } from "jsonc-parser"
import path from "path"

export class CancelledError extends Schema.TaggedErrorClass<CancelledError>()("UICancelledError", {}) {}

export const Style = {
  TEXT_HIGHLIGHT: "\x1b[96m",
  TEXT_HIGHLIGHT_BOLD: "\x1b[96m\x1b[1m",
  TEXT_DIM: "\x1b[90m",
  TEXT_DIM_BOLD: "\x1b[90m\x1b[1m",
  TEXT_NORMAL: "\x1b[0m",
  TEXT_NORMAL_BOLD: "\x1b[1m",
  TEXT_WARNING: "\x1b[93m",
  TEXT_WARNING_BOLD: "\x1b[93m\x1b[1m",
  TEXT_DANGER: "\x1b[91m",
  TEXT_DANGER_BOLD: "\x1b[91m\x1b[1m",
  TEXT_SUCCESS: "\x1b[92m",
  TEXT_SUCCESS_BOLD: "\x1b[92m\x1b[1m",
  TEXT_INFO: "\x1b[94m",
  TEXT_INFO_BOLD: "\x1b[94m\x1b[1m",
}

const configFile = ["miaopan-code.jsonc", "miaopan-code.json", "config.json"]
  .map((file) => path.join(Global.make().config, file))
  .find((file) => existsSync(file))
const config = configFile ? parse(await Bun.file(configFile).text()) : undefined
let language: Language = resolveLanguage(
  typeof config === "object" && config !== null && "language" in config ? config.language : undefined,
)

export function setLanguage(input: unknown) {
  language = resolveLanguage(input)
}

export function getLanguage() {
  return language
}

export function t(key: MessageKey, parameters?: MessageParameters) {
  return I18n.t(language, key, parameters)
}

export function println(...message: string[]) {
  print(...message)
  process.stderr.write(EOL)
}

export function print(...message: string[]) {
  blank = false
  process.stderr.write(message.join(" "))
}

let blank = false
export function empty() {
  if (blank) return
  println("" + Style.TEXT_NORMAL)
  blank = true
}

export async function input(prompt: string): Promise<string> {
  const readline = require("readline")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export function error(message: string) {
  if (message.startsWith("Error: ")) message = message.slice("Error: ".length)
  println(Style.TEXT_DANGER_BOLD + t("cli.error") + Style.TEXT_NORMAL + message)
}

export function markdown(text: string): string {
  return text
}

export * as UI from "./ui"
