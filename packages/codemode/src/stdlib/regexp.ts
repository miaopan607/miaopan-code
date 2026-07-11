export const regexpMethods = new Set(["test", "exec", "toString"])

export const regexpProperties = new Set([
  "source",
  "flags",
  "lastIndex",
  "global",
  "ignoreCase",
  "multiline",
  "sticky",
  "unicode",
  "dotAll",
])

export const regexFailureReason = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).replace(/^Invalid regular expression:\s*/i, "")

export const escapeRegexHintFor = (language?: Language) => t(language, "codemode.stdlib.regex_escape_hint")

export const escapeRegexHint = escapeRegexHintFor()

export const toHostRegex = (
  arg: unknown,
  method: string,
  node: AstNode,
  extraFlags = "",
  language?: Language,
): RegExp => {
  language ??= languageOf(node)
  if (arg instanceof SandboxRegExp) return arg.regex
  if (typeof arg === "string") {
    try {
      return new RegExp(arg, extraFlags)
    } catch (error) {
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.regex_invalid_pattern", {
          method,
          value: JSON.stringify(arg),
          cause: regexFailureReason(error),
          hint: escapeRegexHintFor(language),
        }),
        node,
      ).as("SyntaxError")
    }
  }
  throw new InterpreterRuntimeError(
    t(language, "codemode.stdlib.regex_expected", { method, actual: arg === null ? "null" : typeof arg }),
    node,
  )
}

export const matchToValue = (match: RegExpMatchArray): Array<unknown> => {
  const result: Array<unknown> = Array.from(match, (group) => group)
  if (match.index !== undefined) (result as Record<string, unknown> & Array<unknown>).index = match.index
  if (match.groups) {
    const groups: SafeObject = Object.create(null) as SafeObject
    for (const [key, group] of Object.entries(match.groups)) {
      if (!isBlockedMember(key)) groups[key] = group
    }
    ;(result as Record<string, unknown> & Array<unknown>).groups = groups
  }
  return result
}

export const invokeRegExpMethod = (
  value: SandboxRegExp,
  name: string,
  args: Array<unknown>,
  node: AstNode,
  language?: Language,
): unknown => {
  language ??= languageOf(node)
  switch (name) {
    case "test":
      return value.regex.test(coerceToString(args[0]))
    case "exec": {
      const matched = value.regex.exec(coerceToString(args[0]))
      return matched === null ? null : matchToValue(matched)
    }
    case "toString":
      return coerceToString(value)
    default:
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.unavailable_method", { namespace: "RegExp", name }),
        node,
      )
  }
}
import { type AstNode, InterpreterRuntimeError, languageOf } from "../interpreter/model.js"
import { isBlockedMember, type SafeObject } from "../tool-runtime.js"
import { SandboxRegExp } from "../values.js"
import { coerceToString } from "./value.js"
import { t, type Language } from "../i18n.js"
