import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import path from "path"
import { LSP } from "@/lsp/lsp"
import { t, type Language } from "@miaopan-code/core/i18n"
import { ToolI18n } from "./i18n"
import { InstanceState } from "@/effect/instance-state"
import { pathToFileURL } from "url"
import { assertExternalDirectoryEffect } from "./external-directory"
import { FSUtil } from "@miaopan-code/core/fs-util"

const operations = [
  "goToDefinition",
  "findReferences",
  "hover",
  "documentSymbol",
  "workspaceSymbol",
  "goToImplementation",
  "prepareCallHierarchy",
  "incomingCalls",
  "outgoingCalls",
] as const

export const makeParameters = (language?: Language) =>
  Schema.Struct({
    operation: Schema.Literals(operations).annotate({ description: t(language, "tool.param.lsp_operation") }),
    filePath: Schema.String.annotate({ description: t(language, "tool.param.lsp_path") }),
    line: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)).annotate({
      description: t(language, "tool.param.lsp_line"),
    }),
    character: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)).annotate({
      description: t(language, "tool.param.lsp_character"),
    }),
    query: Schema.optional(Schema.String).annotate({
      description: t(language, "tool.param.lsp_query"),
    }),
  })
export const Parameters = makeParameters()

export const LspTool = Tool.define(
  "lsp",
  Effect.gen(function* () {
    const lsp = yield* LSP.Service
    const fs = yield* FSUtil.Service
    const language = yield* ToolI18n.language()
    return {
      description: yield* ToolI18n.description("tool.lsp"),
      parameters: makeParameters(language),
      execute: (args: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const instance = yield* InstanceState.context
          const file = path.isAbsolute(args.filePath) ? args.filePath : path.join(instance.directory, args.filePath)
          yield* assertExternalDirectoryEffect(ctx, file)
          const meta =
            args.operation === "workspaceSymbol"
              ? { operation: args.operation }
              : args.operation === "documentSymbol"
                ? { operation: args.operation, filePath: file }
                : { operation: args.operation, filePath: file, line: args.line, character: args.character }
          yield* ctx.ask({
            permission: "lsp",
            patterns: ["*"],
            always: ["*"],
            metadata: meta,
          })

          const uri = pathToFileURL(file).href
          const position = { file, line: args.line - 1, character: args.character - 1 }
          const relPath = path.relative(instance.worktree, file)
          const detail =
            args.operation === "workspaceSymbol"
              ? ""
              : args.operation === "documentSymbol"
                ? relPath
                : `${relPath}:${args.line}:${args.character}`
          const title = detail ? `${args.operation} ${detail}` : args.operation

          const exists = yield* fs.existsSafe(file)
          if (!exists) throw new Error(ToolI18n.text(ctx, "tool.file_not_found", { path: file }))

          const available = yield* lsp.hasClients(file)
          if (!available) throw new Error(ToolI18n.text(ctx, "tool.lsp_unavailable"))

          yield* lsp.touchFile(file, "document")

          const result: unknown[] = yield* (() => {
            switch (args.operation) {
              case "goToDefinition":
                return lsp.definition(position)
              case "findReferences":
                return lsp.references(position)
              case "hover":
                return lsp.hover(position)
              case "documentSymbol":
                return lsp.documentSymbol(uri)
              case "workspaceSymbol":
                return lsp.workspaceSymbol(args.query ?? "")
              case "goToImplementation":
                return lsp.implementation(position)
              case "prepareCallHierarchy":
                return lsp.prepareCallHierarchy(position)
              case "incomingCalls":
                return lsp.incomingCalls(position)
              case "outgoingCalls":
                return lsp.outgoingCalls(position)
            }
          })()

          return {
            title,
            metadata: { result },
            output:
              result.length === 0
                ? ToolI18n.text(undefined, "tool.lsp_no_results", { operation: args.operation })
                : JSON.stringify(result, null, 2),
          }
        }).pipe(Effect.orDie),
    }
  }),
)
