export const numberMethods = new Set(["toFixed", "toPrecision", "toExponential", "toString"])

export const numberConstants = new Set(["MAX_SAFE_INTEGER", "MIN_SAFE_INTEGER", "MAX_VALUE", "MIN_VALUE", "EPSILON"])

export const numberStatics = new Set(["isInteger", "isFinite", "isNaN", "isSafeInteger", "parseInt", "parseFloat"])

export const invokeNumberMethod = (
  value: number,
  name: string,
  args: Array<unknown>,
  node: AstNode,
  language?: Language,
): unknown => {
  language ??= languageOf(node)
  const optNum = (index: number): number | undefined => {
    const arg = args[index]
    if (arg === undefined) return undefined
    if (typeof arg !== "number")
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.expects_number_argument", { name: `Number.${name}` }),
        node,
      )
    return arg
  }
  let result: unknown
  switch (name) {
    case "toFixed":
      result = value.toFixed(optNum(0))
      break
    case "toExponential":
      result = value.toExponential(optNum(0))
      break
    case "toPrecision": {
      const digits = optNum(0)
      result = digits === undefined ? value.toString() : value.toPrecision(digits)
      break
    }
    case "toString": {
      const radix = optNum(0)
      if (radix !== undefined && (radix < 2 || radix > 36)) {
        throw new InterpreterRuntimeError(t(language, "codemode.stdlib.radix_range"), node)
      }
      result = value.toString(radix)
      break
    }
    default:
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.unavailable_method", { namespace: "Number", name }),
        node,
      )
  }
  return boundedData(result, t(language, "codemode.stdlib.method_result", { name: `Number.${name}` }), language)
}

export const invokeNumberStatic = (name: string, args: Array<unknown>, node: AstNode, language?: Language): unknown => {
  language ??= languageOf(node)
  const value = args[0]
  switch (name) {
    case "isInteger":
      return Number.isInteger(value)
    case "isFinite":
      return Number.isFinite(value)
    case "isNaN":
      return Number.isNaN(value)
    case "isSafeInteger":
      return Number.isSafeInteger(value)
    case "parseInt": {
      const radix = args[1]
      if (radix !== undefined && typeof radix !== "number") {
        throw new InterpreterRuntimeError(
          t(language, "codemode.stdlib.numeric_radix", { name: "Number.parseInt" }),
          node,
        )
      }
      return parseInt(coerceToString(value), radix)
    }
    case "parseFloat":
      return parseFloat(coerceToString(value))
    default:
      throw new InterpreterRuntimeError(
        t(language, "codemode.stdlib.unavailable_static", { namespace: "Number", name }),
        node,
      )
  }
}
import { type AstNode, InterpreterRuntimeError, languageOf } from "../interpreter/model.js"
import { t, type Language } from "../i18n.js"
import { boundedData, coerceToString } from "./value.js"
