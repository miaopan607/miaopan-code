import { Effect } from "effect"
import { effectCmd } from "../../effect-cmd"
import { UI } from "@/cli/ui"

export const AgentCommand = effectCmd({
  command: "agent <name>",
  describe: UI.t("cli.show_debug"),
  builder: (yargs) =>
    yargs
      .positional("name", {
        type: "string",
        demandOption: true,
        description: UI.t("cli.agent_name"),
      })
      .option("tool", {
        type: "string",
        description: UI.t("cli.tool_id"),
      })
      .option("params", {
        type: "string",
        description: UI.t("cli.tool_params"),
      }),
  handler: (args) =>
    Effect.gen(function* () {
      const { debugAgent } = yield* Effect.promise(() => import("./agent.handler"))
      return yield* debugAgent(args)
    }),
})
