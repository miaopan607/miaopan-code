export const stringMethods = new Set([
  "toLowerCase",
  "toUpperCase",
  "trim",
  "trimStart",
  "trimEnd",
  "trimLeft",
  "trimRight",
  "split",
  "slice",
  "substring",
  "substr",
  "includes",
  "startsWith",
  "endsWith",
  "indexOf",
  "lastIndexOf",
  "replace",
  "replaceAll",
  "repeat",
  "padStart",
  "padEnd",
  "charAt",
  "charCodeAt",
  "codePointAt",
  "at",
  "concat",
  "toString",
  "match",
  "matchAll",
  "search",
  "localeCompare",
  "normalize",
])

export const stringStatics = new Set(["fromCharCode", "fromCodePoint"])

export const invokeStringStatic = (name: string, args: Array<unknown>, node: AstNode, language?: Language): unknown => {
  language ??= languageOf(node)
  const codes = args.map((arg) => {
    if (typeof arg !== "number")
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.expects_number_arguments", { name: `String.${name}` }),
        node,
      )
    return arg
  })
  switch (name) {
    case "fromCharCode":
      return String.fromCharCode(...codes)
    case "fromCodePoint":
      return String.fromCodePoint(...codes)
    default:
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.unavailable_static", { namespace: "String", name }),
        node,
      )
  }
}
import { type AstNode, InterpreterRuntimeError, languageOf } from "../interpreter/model.js"
import { t, type Language } from "../i18n.js"
