import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { CommandV2 } from "@miaopan-code/core/command"
import { Config } from "@miaopan-code/core/config"
import { AppNodeBuilder } from "@miaopan-code/core/effect/app-node-builder"
import { Location } from "@miaopan-code/core/location"
import { CommandPlugin } from "@miaopan-code/core/plugin/command"
import { AbsolutePath } from "@miaopan-code/core/schema"
import { location } from "../fixture/location"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const directory = AbsolutePath.make("/repo/project")
const project = AbsolutePath.make("/repo")
const locationLayer = Layer.succeed(
  Location.Service,
  Location.Service.of(location({ directory }, { projectDirectory: project })),
)
const it = testEffect(AppNodeBuilder.build(CommandV2.node, [[Location.node, locationLayer]]))

describe("CommandPlugin.Plugin", () => {
  it.effect("registers built-in init and review commands", () =>
    Effect.gen(function* () {
      const command = yield* CommandV2.Service
      yield* CommandPlugin.Plugin.effect(
        host({
          command: { transform: command.transform, reload: command.reload },
        }),
      ).pipe(
        Effect.provideService(Config.Service, Config.Service.of({ entries: () => Effect.succeed([]) })),
        Effect.provideService(
          Location.Service,
          Location.Service.of(location({ directory }, { projectDirectory: project })),
        ),
      )

      expect(yield* command.get("init")).toMatchObject({
        name: "init",
        description: "引导式 AGENTS.md 设置",
      })
      expect((yield* command.get("init"))?.template).toContain("`/repo`")
      expect((yield* command.get("init"))?.template).toContain("为此仓库创建或更新")
      expect(yield* command.get("review")).toMatchObject({
        name: "review",
        description: "审查更改 [commit|branch|pr]，默认为未提交更改",
        subtask: true,
      })

      yield* CommandPlugin.Plugin.effect(
        host({
          command: { transform: command.transform, reload: command.reload },
        }),
      ).pipe(
        Effect.provideService(
          Config.Service,
          Config.Service.of({
            entries: () =>
              Effect.succeed([new Config.Document({ type: "document", info: new Config.Info({ language: "en" }) })]),
          }),
        ),
        Effect.provideService(
          Location.Service,
          Location.Service.of(location({ directory }, { projectDirectory: project })),
        ),
      )

      expect(yield* command.get("init")).toMatchObject({
        name: "init",
        description: "guided AGENTS.md setup",
      })
      expect((yield* command.get("init"))?.template).toContain("Create or update")
      expect(yield* command.get("review")).toMatchObject({
        name: "review",
        description: "review changes [commit|branch|pr], defaults to uncommitted",
        subtask: true,
      })
    }),
  )
})
