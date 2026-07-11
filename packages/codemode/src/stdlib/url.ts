export const urlProperties = new Set([
  "href",
  "origin",
  "protocol",
  "username",
  "password",
  "host",
  "hostname",
  "port",
  "pathname",
  "search",
  "hash",
])

export const urlWritableProperties = new Set([
  "href",
  "protocol",
  "username",
  "password",
  "host",
  "hostname",
  "port",
  "pathname",
  "search",
  "hash",
])

export const urlMethods = new Set(["toString", "toJSON"])
export const urlStatics = new Set(["canParse", "parse"])
export const urlSearchParamsMethods = new Set([
  "append",
  "delete",
  "get",
  "getAll",
  "has",
  "set",
  "sort",
  "forEach",
  "keys",
  "values",
  "entries",
  "toString",
])

export const uriArgument = (value: unknown, label: string, language?: Language): string =>
  coerceToString(boundedData(value, label, language))

export const invokeUriFunction = (
  ref: UriFunction,
  args: Array<unknown>,
  node: AstNode,
  language?: Language,
): string => {
  language ??= languageOf(node)
  const value = uriArgument(args[0], t(language, "codemode.stdlib.method_input", { name: ref.name }), language)
  try {
    switch (ref.name) {
      case "encodeURI":
        return encodeURI(value)
      case "encodeURIComponent":
        return encodeURIComponent(value)
      case "decodeURI":
        return decodeURI(value)
      case "decodeURIComponent":
        return decodeURIComponent(value)
    }
  } catch (error) {
    throw new InterpreterRuntimeError(
      t(language, "codemode.stdlib.uri_malformed", {
        name: ref.name,
        cause: error instanceof Error ? error.message : String(error),
      }),
      node,
    ).as("URIError")
  }
}

export const urlArgument = (value: unknown, label: string, language?: Language): string =>
  value instanceof SandboxURL ? value.url.href : uriArgument(value, label, language)

export const invokeURLStatic = (name: string, args: Array<unknown>, node: AstNode, language?: Language): unknown => {
  language ??= languageOf(node)
  const method = `URL.${name}`
  if (!urlStatics.has(name))
    throw new InterpreterRuntimeError(
      t(language, "codemode.stdlib.unavailable_static", { namespace: "URL", name }),
      node,
    )
  if (args.length === 0)
    throw new InterpreterRuntimeError(t(language, "codemode.stdlib.url_argument_required", { name: method }), node).as(
      "TypeError",
    )
  const input = urlArgument(args[0], t(language, "codemode.stdlib.method_input", { name: method }), language)
  const base =
    args[1] === undefined
      ? undefined
      : urlArgument(args[1], t(language, "codemode.stdlib.method_base", { name: method }), language)
  try {
    const url = new URL(input, base)
    return name === "canParse" ? true : new SandboxURL(url)
  } catch {
    return name === "canParse" ? false : null
  }
}

export const invokeURLMethod = (value: SandboxURL, name: string, node: AstNode, language?: Language): string => {
  language ??= languageOf(node)
  if (name === "toString" || name === "toJSON") return value.url.href
  throw new InterpreterRuntimeError(t(language, "codemode.stdlib.unavailable_method", { namespace: "URL", name }), node)
}
import { type AstNode, InterpreterRuntimeError, languageOf, UriFunction } from "../interpreter/model.js"
import { t, type Language } from "../i18n.js"
import { SandboxURL } from "../values.js"
import { boundedData, coerceToString } from "./value.js"
