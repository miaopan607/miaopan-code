import { cmd } from "./cmd"
import { UI } from "@/cli/ui"
import { errorMessage } from "@miaopan-code/tui/util/error"
import { validateSession } from "../tui/validate-session"
import { ServerAuth } from "@/server/auth"

export const AttachCommand = cmd({
  command: "attach <url>",
  describe: UI.t("cli.attach_server"),
  builder: (yargs) =>
    yargs
      .positional("url", {
        type: "string",
        describe: "http://localhost:4096",
        demandOption: true,
      })
      .option("dir", {
        type: "string",
        description: UI.t("cli.directory"),
      })
      .option("continue", {
        alias: ["c"],
        describe: UI.t("cli.continue_last"),
        type: "boolean",
      })
      .option("session", {
        alias: ["s"],
        type: "string",
        describe: UI.t("cli.session_id"),
      })
      .option("fork", {
        type: "boolean",
        describe: UI.t("cli.fork_session"),
      })
      .option("password", {
        alias: ["p"],
        type: "string",
        describe: UI.t("cli.password"),
      })
      .option("username", {
        alias: ["u"],
        type: "string",
        describe: UI.t("cli.username"),
      })
      .option("mini", {
        type: "boolean",
        describe: UI.t("cli.direct_mode"),
        default: false,
      })
      .option("replay", {
        type: "boolean",
        hidden: true,
      })
      .option("no-replay", {
        type: "boolean",
        describe: UI.t("cli.replay_history"),
      })
      .option("replay-limit", {
        type: "number",
        describe: UI.t("cli.replay_limit"),
      }),
  handler: async (args) => {
    if (args.replay === true) {
      UI.error(UI.t("cli.replay_unsupported"))
      process.exitCode = 1
      return
    }
    const noReplay = args.replay === false || args.noReplay === true

    const directory = (() => {
      if (!args.dir) return undefined
      try {
        process.chdir(args.dir)
        return process.cwd()
      } catch {
        // If the directory doesn't exist locally (remote attach), pass it through.
        return args.dir
      }
    })()

    if (args.mini) {
      const { runMini } = await import("./run")
      await runMini({
        attach: args.url,
        directory,
        password: args.password,
        username: args.username,
        continue: args.continue,
        session: args.session,
        fork: args.fork,
        replay: noReplay ? false : undefined,
        replayLimit: args.replayLimit,
      })
      return
    }

    const unsupported = [
      ["--no-replay", noReplay],
      ["--replay-limit", args.replayLimit !== undefined],
    ].find((entry) => entry[1])?.[0]
    if (unsupported) {
      UI.error(UI.t("cli.requires_mini", { option: String(unsupported) }))
      process.exitCode = 1
      return
    }

    const { TuiConfig } = await import("@/config/tui")
    if (args.fork && !args.continue && !args.session) {
      UI.error(UI.t("cli.fork_requires"))
      process.exitCode = 1
      return
    }

    const headers = ServerAuth.headers({ password: args.password, username: args.username })
    const config = await TuiConfig.get()

    try {
      await validateSession({
        url: args.url,
        sessionID: args.session,
        directory,
        headers,
      })
    } catch (error) {
      UI.error(errorMessage(error))
      process.exitCode = 1
      return
    }

    const { Effect } = await import("effect")
    const { run } = await import("../tui/layer")
    const { createLegacyTuiPluginHost } = await import("@/plugin/tui/runtime")
    await Effect.runPromise(
      run({
        url: args.url,
        config,
        pluginHost: createLegacyTuiPluginHost(),
        args: {
          continue: args.continue,
          sessionID: args.session,
          fork: args.fork,
        },
        directory,
        headers,
      }),
    )
  },
})
