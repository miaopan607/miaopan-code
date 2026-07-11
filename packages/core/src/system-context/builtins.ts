export * as SystemContextBuiltIns from "./builtins"

import { makeLocationNode } from "../effect/app-node"
import { DateTime, Effect, Layer, Schema } from "effect"
import { Location } from "../location"
import { SystemContext } from "./index"
import { InstructionContext } from "../instruction-context"
import { SystemContextRegistry } from "./registry"
import { FSUtil } from "../fs-util"
import { Global } from "../global"
import { Config } from "../config"
import { t } from "../i18n"

const builtIns = Layer.effectDiscard(
  Effect.gen(function* () {
    const config = yield* Config.Service
    const location = yield* Location.Service
    const registry = yield* SystemContextRegistry.Service
    const language = Config.latest(yield* config.entries(), "language")
    const environment = [
      "<env>",
      `  ${t(language, "prompt.environment_working_directory", { value: location.directory })}`,
      `  ${t(language, "prompt.environment_workspace_root", { value: location.project.directory })}`,
      `  ${t(language, "prompt.environment_git_repo", { value: t(language, location.vcs?.type === "git" ? "common.yes" : "common.no") })}`,
      `  ${t(language, "prompt.environment_platform", { value: process.platform })}`,
      "</env>",
    ].join("\n")
    const context = SystemContext.combine([
      SystemContext.make({
        key: SystemContext.Key.make("core/environment"),
        codec: Schema.toCodecJson(Schema.String),
        load: Effect.succeed(environment),
        baseline: (environment) => t(language, "prompt.environment_baseline", { environment }),
        update: (_previous, environment) => t(language, "prompt.environment_updated", { environment }),
      }),
      SystemContext.make({
        key: SystemContext.Key.make("core/date"),
        codec: Schema.toCodecJson(Schema.String),
        load: DateTime.nowAsDate.pipe(Effect.map((date) => date.toDateString())),
        baseline: (date) => t(language, "prompt.environment_date", { value: date }),
        update: (_previous, date) => t(language, "prompt.environment_date_updated", { date }),
      }),
    ])

    yield* registry.register({ key: SystemContext.Key.make("core/builtins"), load: Effect.succeed(context) })
  }),
)

export const node = makeLocationNode({
  name: "system-context-builtins",
  layer: builtIns,
  deps: [Config.node, Location.node, SystemContextRegistry.node, InstructionContext.node, FSUtil.node, Global.node],
})
