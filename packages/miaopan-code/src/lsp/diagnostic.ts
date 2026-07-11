import * as LSPClient from "./client"
import { t, type Language } from "@miaopan-code/core/i18n"

const MAX_PER_FILE = 20

export function pretty(diagnostic: LSPClient.Diagnostic, language?: Language) {
  const severityMap = {
    1: t(language, "lsp.severity_error"),
    2: t(language, "lsp.severity_warn"),
    3: t(language, "lsp.severity_info"),
    4: t(language, "lsp.severity_hint"),
  }

  const severity = severityMap[diagnostic.severity || 1]
  const line = diagnostic.range.start.line + 1
  const col = diagnostic.range.start.character + 1

  return `${severity} [${line}:${col}] ${diagnostic.message}`
}

export function report(file: string, issues: LSPClient.Diagnostic[], language?: Language) {
  const errors = issues.filter((item) => item.severity === 1)
  if (errors.length === 0) return ""
  const limited = errors.slice(0, MAX_PER_FILE)
  const more = errors.length - MAX_PER_FILE
  const suffix = more > 0 ? `\n${t(language, "lsp.diagnostics_more", { count: more })}` : ""
  return `<diagnostics file="${file}">\n${limited.map((diagnostic) => pretty(diagnostic, language)).join("\n")}${suffix}\n</diagnostics>`
}

export * as Diagnostic from "./diagnostic"
