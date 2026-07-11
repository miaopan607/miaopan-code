import { EOL } from "os"
import { Effect } from "effect"
import { FileSystem } from "@miaopan-code/core/filesystem"
import { LocationServiceMap, locationServiceMapLayer } from "@miaopan-code/core/location-services"
import { Location } from "@miaopan-code/core/location"
import { AbsolutePath, RelativePath } from "@miaopan-code/core/schema"
import { effectCmd } from "../../effect-cmd"
import { cmd } from "../cmd"
import { UI } from "@/cli/ui"

const filesystem = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.provide(LocationServiceMap.Service.get(Location.Ref.make({ directory: AbsolutePath.make(process.cwd()) }))),
    Effect.provide(locationServiceMapLayer),
  )

const FileSearchCommand = effectCmd({
  command: "search <query>",
  describe: UI.t("cli.search_files"),
  builder: (yargs) =>
    yargs.positional("query", {
      type: "string",
      demandOption: true,
      description: UI.t("cli.search_query"),
    }),
  handler: Effect.fn("Cli.debug.file.search")(function* (args) {
    const results = yield* Effect.orDie(filesystem(FileSystem.Service.use((svc) => svc.find({ query: args.query }))))
    process.stdout.write(results.map((item) => item.path).join(EOL) + EOL)
  }),
})

const FileReadCommand = effectCmd({
  command: "read <path>",
  describe: UI.t("cli.read_json"),
  builder: (yargs) =>
    yargs.positional("path", {
      type: "string",
      demandOption: true,
      description: UI.t("cli.file_path_read"),
    }),
  handler: Effect.fn("Cli.debug.file.read")(function* (args) {
    const file = yield* filesystem(FileSystem.Service.use((svc) => svc.read({ path: RelativePath.make(args.path) })))
    process.stdout.write(
      JSON.stringify(
        { content: Buffer.from(file.content).toString("base64"), encoding: "base64", mime: file.mime },
        null,
        2,
      ) + EOL,
    )
  }),
})

const FileListCommand = effectCmd({
  command: "list <path>",
  describe: UI.t("cli.list_directory"),
  builder: (yargs) =>
    yargs.positional("path", {
      type: "string",
      demandOption: true,
      description: UI.t("cli.file_path_list"),
    }),
  handler: Effect.fn("Cli.debug.file.list")(function* (args) {
    const files = yield* filesystem(FileSystem.Service.use((svc) => svc.list({ path: RelativePath.make(args.path) })))
    process.stdout.write(JSON.stringify(files, null, 2) + EOL)
  }),
})

export const FileCommand = cmd({
  command: "file",
  describe: UI.t("cli.debug_tools"),
  builder: (yargs) =>
    yargs.command(FileReadCommand).command(FileListCommand).command(FileSearchCommand).demandCommand(),
  async handler() {},
})
