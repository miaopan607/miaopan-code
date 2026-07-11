import { LSP } from "@/lsp/lsp"
import { Effect } from "effect"
import { effectCmd } from "../../effect-cmd"
import { cmd } from "../cmd"
import { EOL } from "os"
import { UI } from "@/cli/ui"

export const LSPCommand = cmd({
  command: "lsp",
  describe: UI.t("cli.lsp_tools"),
  builder: (yargs) =>
    yargs.command(DiagnosticsCommand).command(SymbolsCommand).command(DocumentSymbolsCommand).demandCommand(),
  async handler() {},
})

const DiagnosticsCommand = effectCmd({
  command: "diagnostics <file>",
  describe: UI.t("cli.lsp_diagnostics"),
  builder: (yargs) => yargs.positional("file", { type: "string", demandOption: true }),
  handler: Effect.fn("Cli.debug.lsp.diagnostics")(function* (args) {
    const out = yield* LSP.Service.use((lsp) =>
      Effect.gen(function* () {
        yield* lsp.touchFile(args.file, "full")
        return yield* lsp.diagnostics()
      }),
    )
    process.stdout.write(JSON.stringify(out, null, 2) + EOL)
  }),
})

export const SymbolsCommand = effectCmd({
  command: "symbols <query>",
  describe: UI.t("cli.lsp_symbols"),
  builder: (yargs) => yargs.positional("query", { type: "string", demandOption: true }),
  handler: Effect.fn("Cli.debug.lsp.symbols")(function* (args) {
    yield* Effect.logInfo(UI.t("cli.lsp.symbols_output"))
    const results = yield* LSP.Service.use((lsp) => lsp.workspaceSymbol(args.query))
    process.stdout.write(JSON.stringify(results, null, 2) + EOL)
  }),
})

export const DocumentSymbolsCommand = effectCmd({
  command: "document-symbols <uri>",
  describe: UI.t("cli.lsp_document_symbols"),
  builder: (yargs) => yargs.positional("uri", { type: "string", demandOption: true }),
  handler: Effect.fn("Cli.debug.lsp.documentSymbols")(function* (args) {
    yield* Effect.logInfo(UI.t("cli.lsp.document_symbols_output"))
    const results = yield* LSP.Service.use((lsp) => lsp.documentSymbol(args.uri))
    process.stdout.write(JSON.stringify(results, null, 2) + EOL)
  }),
})
