import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { t } from "@miaopan-code/core/i18n"
import { ToolI18n } from "./i18n"

export const Parameters = Schema.Struct({
  tool: Schema.String,
  error: Schema.String,
})

export const InvalidTool = Tool.define(
  "invalid",
  Effect.gen(function* () {
    const language = yield* ToolI18n.language()
    return {
      description: t(language, "tool.invalid_description"),
      parameters: Parameters,
      execute: (params: { tool: string; error: string }, ctx: Tool.Context) =>
        Effect.succeed({
          title: ToolI18n.text(ctx, "tool.invalid_tool"),
          output: ToolI18n.text(ctx, "tool.invalid_arguments_output", { error: params.error }),
          metadata: {},
        }),
    }
  }),
)
