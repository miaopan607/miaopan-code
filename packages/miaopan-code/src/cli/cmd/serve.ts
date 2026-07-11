import { Effect } from "effect"
import { effectCmd } from "../effect-cmd"
import { withNetworkOptions, resolveNetworkOptions } from "../network"
import { Flag } from "@miaopan-code/core/flag/flag"
import { UI } from "@/cli/ui"

export const ServeCommand = effectCmd({
  command: "serve",
  builder: (yargs) => withNetworkOptions(yargs),
  describe: UI.t("cli.server_headless"),
  // Server loads instances per-request via x-miaopanCode-directory header — no
  // need for an ambient project InstanceContext at startup.
  instance: false,
  handler: Effect.fn("Cli.serve")(function* (args) {
    const { Server } = yield* Effect.promise(() => import("../../server/server"))
    if (!Flag.MIAOPAN_CODE_SERVER_PASSWORD) {
      console.log(UI.t("server.password_warning"))
    }
    const opts = yield* resolveNetworkOptions(args)
    const server = yield* Effect.promise(() => Server.listen(opts))
    console.log(UI.t("server.listening", { host: server.hostname, port: server.port }))

    yield* Effect.never
  }),
})
