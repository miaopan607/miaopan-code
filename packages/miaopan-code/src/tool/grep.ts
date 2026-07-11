import path from "path"
import { Effect, Schema } from "effect"
import { InstanceState } from "@/effect/instance-state"
import { FSUtil } from "@miaopan-code/core/fs-util"
import { Ripgrep } from "@miaopan-code/core/ripgrep"
import { assertExternalDirectoryEffect } from "./external-directory"
import * as Tool from "./tool"
import { ToolI18n } from "./i18n"
import { t, type Language } from "@miaopan-code/core/i18n"

export const makeParameters = (language?: Language) =>
  Schema.Struct({
    pattern: Schema.String.annotate({ description: t(language, "tool.param.grep_pattern") }),
    path: Schema.optional(Schema.String).annotate({
      description: t(language, "tool.param.grep_path"),
    }),
    include: Schema.optional(Schema.String).annotate({
      description: t(language, "tool.param.grep_include"),
    }),
  })
export const Parameters = makeParameters()

export const GrepTool = Tool.define(
  "grep",
  Effect.gen(function* () {
    const language = yield* ToolI18n.language()
    const fs = yield* FSUtil.Service
    const ripgrep = yield* Ripgrep.Service
    return {
      description: yield* ToolI18n.description("tool.grep"),
      parameters: makeParameters(language),
      execute: (params: { pattern: string; path?: string; include?: string }, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const empty = {
            title: params.pattern,
            metadata: { matches: 0, truncated: false },
            output: ToolI18n.text(ctx, "tool.no_files"),
          }
          if (!params.pattern) {
            throw new Error(ToolI18n.text(ctx, "tool.pattern_required"))
          }

          yield* ctx.ask({
            permission: "grep",
            patterns: [params.pattern],
            always: ["*"],
            metadata: {
              pattern: params.pattern,
              path: params.path,
              include: params.include,
            },
          })

          const ins = yield* InstanceState.context
          const requested = path.isAbsolute(params.path ?? ins.directory)
            ? (params.path ?? ins.directory)
            : path.join(ins.directory, params.path ?? ".")
          const requestedInfo = yield* fs.stat(requested).pipe(Effect.catch(() => Effect.succeed(undefined)))
          yield* assertExternalDirectoryEffect(ctx, requested, {
            bypass: false,
            kind: requestedInfo?.type === "Directory" ? "directory" : "file",
          })

          const search = FSUtil.resolve(requested)
          const info = yield* fs.stat(search).pipe(Effect.catch(() => Effect.succeed(undefined)))
          const cwd = info?.type === "Directory" ? search : path.dirname(search)
          const result = yield* ripgrep.grep({
            cwd,
            pattern: params.pattern,
            include: params.include,
            limit: 100,
          })
          if (result.length === 0) return empty

          const rows = result.map((item) => ({
            path: path.resolve(cwd, item.entry.path),
            line: item.line,
            text: item.text,
          }))

          const limit = 100
          const truncated = rows.length === limit
          const final = rows
          if (final.length === 0) return empty

          const total = rows.length
          const hasMore = truncated || result.length === limit
          const output = [
            ToolI18n.text(ctx, "tool.matches", {
              count: total,
              suffix: hasMore ? ToolI18n.text(ctx, "tool.more_matches") : "",
            }),
          ]

          let current = ""
          for (const match of final) {
            if (current !== match.path) {
              if (current !== "") output.push("")
              current = match.path
              output.push(`${match.path}:`)
            }
            output.push(`  Line ${match.line}: ${match.text}`)
          }

          if (truncated) {
            output.push("")
            output.push(ToolI18n.text(ctx, "tool.results_truncated"))
          }

          return {
            title: params.pattern,
            metadata: {
              matches: total,
              truncated,
            },
            output: output.join("\n"),
          }
        }).pipe(Effect.orDie),
    }
  }),
)
