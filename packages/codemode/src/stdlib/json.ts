import {
  type AstNode,
  CodeModeFunction,
  InterpreterRuntimeError,
  languageOf,
  supportedSyntaxMessageFor,
} from "../interpreter/model.js"
import { copyIn, copyOut } from "../tool-runtime.js"
import { t, type Language } from "../i18n.js"

export const jsonStatics = new Set(["stringify", "parse"])

export const invokeJsonMethod = (name: string, args: Array<unknown>, node: AstNode, language?: Language): unknown => {
  language ??= languageOf(node)
  if (!jsonStatics.has(name))
    throw new InterpreterRuntimeError(
      t(language, "codemode.stdlib.unavailable_static", { namespace: "JSON", name }),
      node,
    )
  switch (name) {
    case "stringify": {
      const replacer = args[1]
      if (Array.isArray(replacer) || replacer instanceof CodeModeFunction) {
        throw new InterpreterRuntimeError(
          t(language, "codemode.stdlib.json_replacer_unsupported"),
          node,
          "UnsupportedSyntax",
          [supportedSyntaxMessageFor(language)],
        )
      }
      const space = args[2]
      const indent = typeof space === "number" || typeof space === "string" ? space : undefined
      return JSON.stringify(
        copyOut(copyIn(args[0], t(language, "codemode.stdlib.json_value"), false, language)),
        null,
        indent,
      )
    }
    case "parse": {
      const text = args[0]
      if (typeof text !== "string")
        throw new InterpreterRuntimeError(t(language, "codemode.stdlib.json_parse_string"), node)
      try {
        return copyIn(
          JSON.parse(text),
          t(language, "codemode.stdlib.method_result", { name: "JSON.parse" }),
          false,
          language,
        )
      } catch (error) {
        throw new InterpreterRuntimeError(
          t(language, "codemode.stdlib.json_parse_invalid", {
            cause: error instanceof Error ? error.message : String(error),
          }),
          node,
        ).as("SyntaxError")
      }
    }
  }
  throw new InterpreterRuntimeError(
    t(language, "codemode.stdlib.unavailable_static", { namespace: "JSON", name }),
    node,
  )
}
