/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeMiaopanCodeContent from "./skill/customize-miaopanCode.md" with { type: "text" }

export const CustomizeMiaopanCodeContent = customizeMiaopanCodeContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-miaopanCode",
            description:
              "Use ONLY when the user is editing or creating miaopanCode's own configuration: miaopan-code.json, miaopan-code.jsonc, files under .miaopanCode/, or files under ~/.config/miaopanCode/. Also use when creating or fixing miaopanCode agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring miaopanCode itself.",
            location: AbsolutePath.make("/builtin/customize-miaopanCode.md"),
            content: CustomizeMiaopanCodeContent,
          }),
        }),
      )
    })
  }),
})
