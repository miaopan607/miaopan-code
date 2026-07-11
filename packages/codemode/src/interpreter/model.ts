import type { SafeObject } from "../tool-runtime.js"
import type { SandboxURL } from "../values.js"
import { t, type Language } from "../i18n.js"

export type SourcePosition = {
  line: number
  column: number
}

export type SourceLocation = {
  start: SourcePosition
  end: SourcePosition
}

export type AstNode = {
  type: string
  loc?: SourceLocation
  [key: string]: unknown
}

const AstLanguage: unique symbol = Symbol("codemode.ast-language")

export const languageOf = (node: AstNode | undefined): Language | undefined =>
  node ? (node as AstNode & { [AstLanguage]?: Language })[AstLanguage] : undefined

export const annotateLanguage = <Node extends AstNode>(root: Node, language: Language | undefined): Node => {
  if (!language) return root
  const seen = new WeakSet<object>()
  const visit = (value: unknown): void => {
    if (typeof value !== "object" || value === null || seen.has(value)) return
    seen.add(value)
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (typeof (value as { type?: unknown }).type === "string") {
      Object.defineProperty(value, AstLanguage, { value: language, configurable: true })
    }
    Object.values(value).forEach(visit)
  }
  visit(root)
  return root
}

export type ProgramNode = AstNode & {
  type: "Program"
  body: Array<AstNode>
}

export type Binding = {
  mutable: boolean
  value: unknown
  initialized?: boolean
}

export type StatementResult =
  | { kind: "none" }
  | { kind: "value"; value: unknown }
  | { kind: "return"; value: unknown }
  | { kind: "break" }
  | { kind: "continue" }

export type MemberReference = {
  target: SafeObject | Array<unknown> | SandboxURL
  key: string | number
}

export class CodeModeFunction {
  constructor(
    readonly parameters: ReadonlyArray<AstNode>,
    readonly body: AstNode,
    readonly capturedScopes: ReadonlyArray<Map<string, Binding>>,
  ) {}
}

export class IntrinsicReference {
  constructor(
    readonly receiver: unknown,
    readonly name: string,
  ) {}
}

export class ComputedValue {
  constructor(readonly value: unknown) {}
}

export class PromiseNamespace {}

export type PromiseMethodName = "all" | "allSettled" | "race" | "resolve" | "reject"

export class PromiseMethodReference {
  constructor(readonly name: PromiseMethodName) {}
}

export type GlobalNamespaceName =
  | "Object"
  | "Math"
  | "JSON"
  | "Array"
  | "console"
  | "Date"
  | "RegExp"
  | "Map"
  | "Set"
  | "URL"
  | "URLSearchParams"

export class GlobalNamespace {
  constructor(readonly name: GlobalNamespaceName) {}
}

export class GlobalMethodReference {
  constructor(
    readonly namespace: GlobalNamespaceName | "Number" | "String",
    readonly name: string,
  ) {}
}

export class CoercionFunction {
  constructor(readonly name: "Number" | "String" | "Boolean" | "parseInt" | "parseFloat") {}
}

export class UriFunction {
  constructor(readonly name: "encodeURI" | "encodeURIComponent" | "decodeURI" | "decodeURIComponent") {}
}

export class ProgramThrow {
  constructor(readonly value: unknown) {}
}

export class ErrorConstructorReference {
  constructor(readonly name: string) {}
}

export type DiagnosticKind =
  | "ParseError"
  | "UnsupportedSyntax"
  | "UnknownTool"
  | "InvalidToolInput"
  | "InvalidToolOutput"
  | "InvalidDataValue"
  | "ToolCallLimitExceeded"
  | "TimeoutExceeded"
  | "ToolFailure"
  | "ExecutionFailure"

export const OptionalShortCircuit: unique symbol = Symbol("codemode.optional-short-circuit")

export const supportedSyntaxMessageFor = (language?: Language) => t(language, "codemode.interpreter.supported_syntax")

export const supportedSyntaxMessage = supportedSyntaxMessageFor()

export class InterpreterRuntimeError extends Error {
  readonly node?: AstNode
  errorName: string = "Error"

  constructor(
    message: string,
    node?: AstNode,
    readonly kind: DiagnosticKind = "ExecutionFailure",
    readonly suggestions?: ReadonlyArray<string>,
  ) {
    super(message)
    this.name = "InterpreterRuntimeError"
    if (node) this.node = node
  }

  as(errorName: string): this {
    this.errorName = errorName
    return this
  }
}

export const unsupportedSyntax = (kind: string, node: AstNode, language?: Language): InterpreterRuntimeError => {
  const resolved = language ?? languageOf(node)
  const supported = supportedSyntaxMessageFor(resolved)
  return new InterpreterRuntimeError(
    t(resolved, "codemode.interpreter.unsupported_syntax", { kind, supported }),
    node,
    "UnsupportedSyntax",
    [supported],
  )
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export const asNode = (value: unknown, context: string, language?: Language): AstNode => {
  const resolved =
    language ?? (isRecord(value) && typeof value.type === "string" ? languageOf(value as AstNode) : undefined)
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new InterpreterRuntimeError(t(resolved, "codemode.interpreter.invalid_ast_node", { context }))
  }
  return value as AstNode
}

export const getArray = (node: AstNode, key: string, language?: Language): Array<unknown> => {
  const value = node[key]
  if (!Array.isArray(value))
    throw new InterpreterRuntimeError(
      t(language ?? languageOf(node), "codemode.interpreter.expected_array", { key }),
      node,
    )
  return value
}

export const getString = (node: AstNode, key: string, language?: Language): string => {
  const value = node[key]
  if (typeof value !== "string")
    throw new InterpreterRuntimeError(
      t(language ?? languageOf(node), "codemode.interpreter.expected_string", { key }),
      node,
    )
  return value
}

export const getBoolean = (node: AstNode, key: string, language?: Language): boolean => {
  const value = node[key]
  if (typeof value !== "boolean")
    throw new InterpreterRuntimeError(
      t(language ?? languageOf(node), "codemode.interpreter.expected_boolean", { key }),
      node,
    )
  return value
}

export const getOptionalNode = (node: AstNode, key: string, language?: Language): AstNode | undefined => {
  const value = node[key]
  if (value === undefined || value === null) return undefined
  return asNode(value, key, language ?? languageOf(node))
}

export const getNode = (node: AstNode, key: string, language?: Language): AstNode =>
  asNode(node[key], key, language ?? languageOf(node))

export const sourceLocation = (node: AstNode): { readonly line: number; readonly column: number } => ({
  line: Math.max(1, (node.loc?.start.line ?? 2) - 1),
  column: Math.max(1, (node.loc?.start.column ?? 4) - 3),
})

export const formatLocation = (node?: AstNode, language?: Language): string => {
  if (!node?.loc) return ""
  const location = sourceLocation(node)
  return t(language ?? languageOf(node), "codemode.interpreter.source_location", location)
}
