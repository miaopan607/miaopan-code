export * as Tool from "./tool"

import { ToolDefinition, ToolFailure, ToolOutput, type ToolCall } from "@miaopan-code/llm"
import { Effect, JsonSchema, Schema } from "effect"
import type { AgentV2 } from "../agent"
import type { SessionMessage } from "../session/message"
import type { SessionSchema } from "../session/schema"
import { localizeKnownText, resolveLanguage, t, type Language } from "../i18n"

export interface Context {
  readonly sessionID: SessionSchema.ID
  readonly agent: AgentV2.ID
  readonly assistantMessageID: SessionMessage.ID
  readonly toolCallID: string
  readonly language?: Language
}

export type SchemaType<A> = Schema.Codec<A, any, never, never>

declare const TypeId: unique symbol

export interface Definition<Input extends SchemaType<any>, Output extends SchemaType<any>> {
  readonly [TypeId]: {
    readonly _Input: Input
    readonly _Output: Output
  }
}

export type AnyTool = Definition<any, any>
export const Failure = ToolFailure
export type Failure = ToolFailure

export class RegistrationError extends Schema.TaggedErrorClass<RegistrationError>()("Tool.RegistrationError", {
  name: Schema.String,
  message: Schema.String,
}) {}

export type Content =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "file"; readonly data: string; readonly mime: string; readonly name?: string }

type Config<
  Input extends SchemaType<any>,
  Output extends SchemaType<any>,
  Structured extends SchemaType<any> = Output,
> = {
  readonly description: string | ((language: Language) => string)
  readonly input: Input | ((language: Language) => Input)
  readonly output: Output | ((language: Language) => Output)
  readonly structured?: Structured | ((language: Language) => Structured)
  readonly toStructuredOutput?: (input: {
    readonly input: Schema.Schema.Type<Input>
    readonly output: Output["Encoded"]
  }) => Schema.Schema.Type<Structured>
  readonly execute: (
    input: Schema.Schema.Type<Input>,
    context: Context,
  ) => Effect.Effect<Schema.Schema.Type<Output>, ToolFailure>
  readonly toModelOutput?: (input: {
    readonly input: Schema.Schema.Type<Input>
    readonly output: Output["Encoded"]
    readonly context: Context
  }) => ReadonlyArray<Content>
}

type Runtime = {
  readonly permission?: string
  readonly definition: (name: string, language: Language) => ToolDefinition
  readonly settle: (call: ToolCall, context: Context) => Effect.Effect<ToolOutput, ToolFailure>
}

const runtimes = new WeakMap<AnyTool, Runtime>()

export function make<
  Input extends SchemaType<any>,
  Output extends SchemaType<any>,
  Structured extends SchemaType<any> = Output,
>(config: Config<Input, Output, Structured>): Definition<Input, Structured> {
  const tool = Object.freeze({}) as Definition<Input, Structured>
  const definitions = new Map<string, ToolDefinition>()
  runtimes.set(tool, {
    definition: (name, language) => {
      const key = `${language}:${name}`
      const cached = definitions.get(key)
      if (cached) return cached
      const input = localized(config.input, language)
      const output = localized(config.output, language)
      const structured = config.structured ? localized(config.structured, language) : undefined
      const definition = new ToolDefinition({
        name,
        description: localizeKnownText(language, localized(config.description, language)),
        inputSchema: toJsonSchema(input, language),
        outputSchema: toJsonSchema(structured ?? output, language),
      })
      definitions.set(key, definition)
      return definition
    },
    settle: (call, context) => {
      const language = resolveLanguage(context.language)
      const inputSchema = localized(config.input, language)
      const outputSchema = localized(config.output, language)
      const structuredSchema = config.structured ? localized(config.structured, language) : undefined
      return Schema.decodeUnknownEffect(inputSchema)(call.input).pipe(
        Effect.mapError(
          (error) => new ToolFailure({ message: t(language, "tool.error.invalid_input", { error: error.message }) }),
        ),
        Effect.flatMap((input) =>
          config.execute(input, context).pipe(
            Effect.flatMap((output) =>
              Schema.encodeEffect(outputSchema)(output).pipe(
                Effect.flatMap((output) => {
                  if (!structuredSchema || !config.toStructuredOutput)
                    return Effect.succeed({ output, structured: output })
                  return Schema.encodeEffect(structuredSchema)(config.toStructuredOutput({ input, output })).pipe(
                    Effect.map((structured) => ({ output, structured })),
                  )
                }),
                Effect.mapError(
                  (error) =>
                    new ToolFailure({
                      message: t(language, "tool.error.invalid_output", { error: error.message }),
                    }),
                ),
              ),
            ),
            Effect.map(({ output, structured }) => ({
              structured,
              content:
                config.toModelOutput?.({ input, output, context }).map((part) =>
                  part.type === "text"
                    ? { type: "text" as const, text: part.text }
                    : {
                        type: "file" as const,
                        uri: `data:${part.mime};base64,${part.data}`,
                        mime: part.mime,
                        name: part.name,
                      },
                ) ?? (typeof output === "string" ? [{ type: "text" as const, text: output }] : []),
            })),
          ),
        ),
      )
    },
  })
  return tool
}

export const validateName = (name: string, language?: Language) =>
  /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name)
    ? Effect.void
    : Effect.fail(new RegistrationError({ name, message: t(language, "tool.error.invalid_name", { name }) }))

export const withPermission = <Input extends SchemaType<any>, Output extends SchemaType<any>>(
  tool: Definition<Input, Output>,
  permission: string,
) => {
  const decorated = Object.freeze({}) as Definition<Input, Output>
  runtimes.set(decorated, { ...runtimeOf(tool), permission })
  return decorated
}

export const permission = (tool: AnyTool, name: string) => runtimeOf(tool).permission ?? name
export const definition = (name: string, tool: AnyTool, language?: Language) =>
  runtimeOf(tool).definition(name, resolveLanguage(language))
export const settle = (tool: AnyTool, call: ToolCall, context: Context) => runtimeOf(tool).settle(call, context)

function runtimeOf(tool: AnyTool) {
  const runtime = runtimes.get(tool)
  if (!runtime) throw new TypeError(t(undefined, "tool.error.invalid_core_value"))
  return runtime
}

function localized<A>(value: A | ((language: Language) => A), language: Language): A {
  return typeof value === "function" ? (value as (language: Language) => A)(language) : value
}

function toJsonSchema(schema: Schema.Top, language: Language): JsonSchema.JsonSchema {
  const document = Schema.toJsonSchemaDocument(schema)
  return localizeJsonSchema(
    Object.keys(document.definitions).length === 0
      ? document.schema
      : { ...document.schema, $defs: document.definitions },
    language,
  ) as JsonSchema.JsonSchema
}

function localizeJsonSchema(value: unknown, language: Language): unknown {
  if (Array.isArray(value)) return value.map((item) => localizeJsonSchema(item, language))
  if (typeof value !== "object" || value === null) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "description" && typeof item === "string"
        ? localizeKnownText(language, item)
        : localizeJsonSchema(item, language),
    ]),
  )
}
