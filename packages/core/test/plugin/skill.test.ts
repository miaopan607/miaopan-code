import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { AppNodeBuilder } from "@miaopan-code/core/effect/app-node-builder"
import { Config } from "@miaopan-code/core/config"
import { t } from "@miaopan-code/core/i18n"
import { SkillPlugin } from "@miaopan-code/core/plugin/skill"
import { SkillV2 } from "@miaopan-code/core/skill"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const it = testEffect(AppNodeBuilder.build(SkillV2.node))

const config = (language?: "zh-CN" | "en") =>
  Config.Service.of({
    entries: () =>
      Effect.succeed(language ? [new Config.Document({ type: "document", info: new Config.Info({ language }) })] : []),
  })

describe("SkillPlugin.Plugin", () => {
  it.effect("registers the built-in customize-miaopanCode skill", () =>
    Effect.gen(function* () {
      const skill = yield* SkillV2.Service
      yield* SkillPlugin.Plugin.effect(host({ skill: { ...skill, reload: skill.reload } })).pipe(
        Effect.provideService(Config.Service, config()),
      )

      expect(yield* skill.list()).toContainEqual(
        expect.objectContaining({
          name: "customize-miaopanCode",
          description: expect.stringContaining("miaopanCode 自身的配置"),
          content: expect.stringContaining("# 自定义 miaopan-code"),
        }),
      )
    }),
  )

  it.effect("registers the English built-in skill when configured", () =>
    Effect.gen(function* () {
      const skill = yield* SkillV2.Service
      yield* SkillPlugin.Plugin.effect(host({ skill: { ...skill, reload: skill.reload } })).pipe(
        Effect.provideService(Config.Service, config("en")),
      )

      expect(yield* skill.list()).toContainEqual(
        expect.objectContaining({
          name: "customize-miaopanCode",
          description: t("en", "skill.customize_miaopan_description"),
          content: expect.stringContaining("# Customizing miaopan-code"),
        }),
      )
    }),
  )
})
