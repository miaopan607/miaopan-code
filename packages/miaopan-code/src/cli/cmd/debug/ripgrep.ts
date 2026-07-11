import { EOL } from "os"
import { Effect } from "effect"
import { Ripgrep } from "@miaopan-code/core/ripgrep"
import { effectCmd } from "../../effect-cmd"
import { cmd } from "../cmd"
import { InstanceRef } from "@/effect/instance-ref"
import { UI } from "@/cli/ui"

export const RipgrepCommand = cmd({
  command: "rg",
  describe: UI.t("cli.debug_tools"),
  builder: (yargs) => yargs.command(FilesCommand).command(SearchCommand).demandCommand(),
  async handler() {},
})

const FilesCommand = effectCmd({
  command: "files",
  describe: UI.t("cli.ripgrep_files"),
  builder: (yargs) =>
    yargs
      .option("query", {
        type: "string",
        description: UI.t("cli.filter_query"),
      })
      .option("glob", {
        type: "string",
        description: UI.t("cli.glob_pattern"),
      })
      .option("limit", {
        type: "number",
        description: UI.t("cli.limit_results"),
      }),
  handler: Effect.fn("Cli.debug.rg.files")(function* (args) {
    const ctx = yield* InstanceRef
    if (!ctx) return
    const ripgrep = yield* Ripgrep.Service
    const files = yield* ripgrep
      .glob({
        cwd: ctx.directory,
        pattern: args.glob ?? "**/*",
        limit: args.limit ?? 10_000,
      })
      .pipe(Effect.orDie)
    process.stdout.write(files.map((file) => file.path).join(EOL) + EOL)
  }),
})

const SearchCommand = effectCmd({
  command: "search <pattern>",
  describe: UI.t("cli.ripgrep_search"),
  builder: (yargs) =>
    yargs
      .positional("pattern", {
        type: "string",
        demandOption: true,
        description: UI.t("cli.search_pattern"),
      })
      .option("glob", {
        type: "array",
        description: UI.t("cli.file_glob_patterns"),
      })
      .option("limit", {
        type: "number",
        description: UI.t("cli.limit_results"),
      }),
  handler: Effect.fn("Cli.debug.rg.search")(function* (args) {
    const ctx = yield* InstanceRef
    if (!ctx) return
    const ripgrep = yield* Ripgrep.Service
    const results = yield* ripgrep
      .grep({
        cwd: ctx.directory,
        pattern: args.pattern,
        include: args.glob?.[0],
        limit: args.limit ?? 10_000,
      })
      .pipe(Effect.orDie)
    process.stdout.write(JSON.stringify(results, null, 2) + EOL)
  }),
})
