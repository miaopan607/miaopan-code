/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { Config } from "../config"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeMiaopanCodeContent from "./skill/customize-miaopanCode.md" with { type: "text" }
import customizeMiaopanCodeZhCNContent from "./skill/customize-miaopanCode.zh-CN.md" with { type: "text" }
import { t } from "../i18n"

export const CustomizeMiaopanCodeContent = customizeMiaopanCodeContent
export const CustomizeMiaopanCodeZhCNContent = customizeMiaopanCodeZhCNContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    const config = yield* Config.Service
    const language = Config.latest(yield* config.entries(), "language")
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-miaopanCode",
            description: t(language, "skill.customize_miaopan_description"),
            location: AbsolutePath.make("/builtin/customize-miaopanCode.md"),
            content: language === "en" ? CustomizeMiaopanCodeContent : CustomizeMiaopanCodeZhCNContent,
          }),
        }),
      )
    })
  }),
})
