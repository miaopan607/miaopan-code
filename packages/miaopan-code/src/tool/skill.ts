import path from "path"
import { Effect, Schema } from "effect"
import { Ripgrep } from "@miaopan-code/core/ripgrep"
import { Skill } from "../skill"
import * as Tool from "./tool"
import { ToolI18n } from "./i18n"
import { t, type Language } from "@miaopan-code/core/i18n"

export function parameterSchema(language: Language = "zh-CN") {
  return Schema.Struct({
    name: Schema.String.annotate({ description: t(language, "tool.param.skill_name") }),
  })
}

export const Parameters = parameterSchema()

export const SkillTool = Tool.define(
  "skill",
  Effect.gen(function* () {
    const skill = yield* Skill.Service
    const ripgrep = yield* Ripgrep.Service
    const language = yield* ToolI18n.language()

    return {
      description: yield* ToolI18n.description("tool.skill"),
      parameters: parameterSchema(language),
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const info = yield* skill.require(params.name).pipe(
            Effect.catchTag("Skill.NotFoundError", (error) =>
              Effect.die(
                new Error(
                  ToolI18n.text(ctx, "error.skill_not_found", {
                    name: error.name,
                    available: error.available.join(", ") || ToolI18n.text(ctx, "common.none"),
                  }),
                ),
              ),
            ),
          )

          yield* ctx.ask({
            permission: "skill",
            patterns: [params.name],
            always: [params.name],
            metadata: {},
          })

          const dir = path.dirname(info.location)
          const base = dir
          const files = yield* ripgrep.find({
            cwd: dir,
            pattern: "!**/SKILL.md",
            hidden: true,
            follow: false,
            signal: ctx.abort,
            limit: 10,
          })

          return {
            title: ToolI18n.text(ctx, "tool.title.skill_loaded", { name: info.name }),
            output: [
              `<skill_content name="${info.name}">`,
              ToolI18n.text(ctx, "tool.skill_heading", { name: info.name }),
              "",
              info.content.trim(),
              "",
              ToolI18n.text(ctx, "tool.skill_base", { base }),
              ToolI18n.text(ctx, "tool.skill_relative"),
              ToolI18n.text(ctx, "tool.skill_files_sampled"),
              "",
              "<skill_files>",
              files.map((file) => `<file>${path.resolve(dir, file.path)}</file>`).join("\n"),
              "</skill_files>",
              "</skill_content>",
            ].join("\n"),
            metadata: {
              name: info.name,
              dir,
            },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
