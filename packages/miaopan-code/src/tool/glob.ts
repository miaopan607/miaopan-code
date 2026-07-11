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
    pattern: Schema.String.annotate({ description: t(language, "tool.param.glob_pattern") }),
    path: Schema.optional(Schema.String).annotate({
      description: t(language, "tool.param.glob_path"),
    }),
  })
export const Parameters = makeParameters()

export const GlobTool = Tool.define(
  "glob",
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service
    const ripgrep = yield* Ripgrep.Service
    const language = yield* ToolI18n.language()
    return {
      description: yield* ToolI18n.description("tool.glob"),
      parameters: makeParameters(language),
      execute: (params: { pattern: string; path?: string }, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const ins = yield* InstanceState.context
          yield* ctx.ask({
            permission: "glob",
            patterns: [params.pattern],
            always: ["*"],
            metadata: {
              pattern: params.pattern,
              path: params.path,
            },
          })

          let search = params.path ?? ins.directory
          search = path.isAbsolute(search) ? search : path.resolve(ins.directory, search)
          const info = yield* fs.stat(search).pipe(Effect.catch(() => Effect.succeed(undefined)))
          if (info?.type === "File") {
            throw new Error(ToolI18n.text(ctx, "tool.glob_directory_required", { path: search }))
          }
          yield* assertExternalDirectoryEffect(ctx, search, {
            bypass: false,
            kind: "directory",
          })

          const limit = 100
          const files = yield* ripgrep.glob({ cwd: search, pattern: params.pattern, limit })
          const truncated = files.length === limit

          const output = []
          if (files.length === 0) output.push(ToolI18n.text(ctx, "tool.output.no_files"))
          if (files.length > 0) {
            output.push(...files.map((file) => path.resolve(search, file.path)))
            if (truncated) {
              output.push("")
              output.push(ToolI18n.text(ctx, "tool.output.glob_truncated", { limit }))
            }
          }

          return {
            title: path.relative(ins.worktree, search),
            metadata: {
              count: files.length,
              truncated,
            },
            output: output.join("\n"),
          }
        }).pipe(Effect.orDie),
    }
  }),
)
