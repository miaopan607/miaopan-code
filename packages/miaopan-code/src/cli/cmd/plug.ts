import { intro, log, outro, spinner } from "@clack/prompts"
import { Effect } from "effect"

import { ConfigPaths } from "@/config/paths"
import { Global } from "@miaopan-code/core/global"
import { installPlugin, patchPluginConfig, readPluginManifest } from "../../plugin/install"
import { resolvePluginTarget } from "../../plugin/shared"
import { errorMessage } from "../../util/error"
import { Filesystem } from "@/util/filesystem"
import { Process } from "@/util/process"
import { UI } from "../ui"
import { effectCmd } from "../effect-cmd"
import { InstanceRef } from "@/effect/instance-ref"

type Spin = {
  start: (msg: string) => void
  stop: (msg: string, code?: number) => void
}

export type PlugDeps = {
  spinner: () => Spin
  log: {
    error: (msg: string) => void
    info: (msg: string) => void
    success: (msg: string) => void
  }
  resolve: (spec: string) => Promise<string>
  readText: (file: string) => Promise<string>
  write: (file: string, text: string) => Promise<void>
  exists: (file: string) => Promise<boolean>
  files: (dir: string, name: "miaopan-code" | "tui") => string[]
  global: string
}

export type PlugInput = {
  mod: string
  global?: boolean
  force?: boolean
}

export type PlugCtx = {
  vcs?: string
  worktree: string
  directory: string
}

const defaultPlugDeps: PlugDeps = {
  spinner: () => spinner(),
  log: {
    error: (msg) => log.error(msg),
    info: (msg) => log.info(msg),
    success: (msg) => log.success(msg),
  },
  resolve: (spec) => resolvePluginTarget(spec),
  readText: (file) => Filesystem.readText(file),
  write: async (file, text) => {
    await Filesystem.write(file, text)
  },
  exists: (file) => Filesystem.exists(file),
  files: (dir, name) => ConfigPaths.fileInDirectory(dir, name),
  global: Global.Path.config,
}

function cause(err: unknown) {
  if (!err || typeof err !== "object") return
  if (!("cause" in err)) return
  return (err as { cause?: unknown }).cause
}

export function createPlugTask(input: PlugInput, dep: PlugDeps = defaultPlugDeps) {
  const mod = input.mod
  const force = Boolean(input.force)
  const global = Boolean(input.global)

  return async (ctx: PlugCtx) => {
    const install = dep.spinner()
    install.start(UI.t("plugin.cli.installing_package"))
    const target = await installPlugin(mod, dep)
    if (!target.ok) {
      install.stop(UI.t("plugin.cli.install_failed"), 1)
      dep.log.error(UI.t("plugin.cli.could_not_install", { mod }))
      const hit = cause(target.error) ?? target.error
      if (hit instanceof Process.RunFailedError) {
        const lines = hit.stderr
          .toString()
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
        const errs = lines.filter((line) => line.startsWith("error:")).map((line) => line.replace(/^error:\s*/, ""))
        const detail = errs[0] ?? lines.at(-1)
        if (detail) dep.log.error(detail)
        if (lines.some((line) => line.includes("No version matching"))) {
          dep.log.info(UI.t("plugin.cli.package_version_unavailable"))
          dep.log.info(UI.t("plugin.cli.registry_hint"))
        }
      }
      if (!(hit instanceof Process.RunFailedError)) {
        dep.log.error(errorMessage(hit))
      }
      return false
    }
    install.stop(UI.t("plugin.cli.package_ready"))

    const inspect = dep.spinner()
    inspect.start(UI.t("plugin.cli.reading_manifest"))
    const manifest = await readPluginManifest(target.target)
    if (!manifest.ok) {
      if (manifest.code === "manifest_read_failed") {
        inspect.stop(UI.t("plugin.cli.manifest_read_failed"), 1)
        dep.log.error(UI.t("plugin.cli.installed_manifest_failed", { mod, file: manifest.file }))
        dep.log.error(errorMessage(cause(manifest.error) ?? manifest.error))
        return false
      }

      if (manifest.code === "manifest_no_targets") {
        inspect.stop(UI.t("plugin.cli.no_targets"), 1)
        dep.log.error(UI.t("plugin.cli.no_entrypoints", { mod }))
        dep.log.info(UI.t("plugin.cli.expected_entrypoints"))
        return false
      }

      inspect.stop(UI.t("plugin.cli.manifest_read_failed"), 1)
      return false
    }

    inspect.stop(
      UI.t("plugin.cli.detected_targets", {
        targets: manifest.targets.map((item) => item.kind).join(" + "),
        suffix: manifest.targets.length === 1 ? "" : "s",
      }),
    )

    const patch = dep.spinner()
    patch.start(UI.t("plugin.cli.updating_config"))
    const out = await patchPluginConfig(
      {
        spec: mod,
        targets: manifest.targets,
        force,
        global,
        vcs: ctx.vcs,
        worktree: ctx.worktree,
        directory: ctx.directory,
        config: dep.global,
      },
      dep,
    )
    if (!out.ok) {
      if (out.code === "invalid_json") {
        patch.stop(UI.t("plugin.cli.failed_updating_kind", { kind: out.kind }), 1)
        dep.log.error(
          UI.t("plugin.cli.invalid_config_json", {
            file: out.file,
            parse: out.parse,
            line: out.line,
            col: out.col,
          }),
        )
        dep.log.info(UI.t("plugin.cli.fix_config"))
        return false
      }

      patch.stop(UI.t("plugin.cli.failed_updating_config"), 1)
      dep.log.error(errorMessage(out.error))
      return false
    }
    patch.stop(UI.t("plugin.cli.config_updated"))
    for (const item of out.items) {
      if (item.mode === "noop") {
        dep.log.info(UI.t("plugin.cli.already_configured", { file: item.file }))
        continue
      }
      if (item.mode === "replace") {
        dep.log.info(UI.t("plugin.cli.replaced", { file: item.file }))
        continue
      }
      dep.log.info(UI.t("plugin.cli.added", { file: item.file }))
    }

    dep.log.success(UI.t("plugin.cli.installed_simple", { mod }))
    dep.log.info(UI.t(global ? "plugin.cli.scope_global" : "plugin.cli.scope_local", { dir: out.dir }))
    return true
  }
}

export const PluginCommand = effectCmd({
  command: "plugin <module>",
  aliases: ["plug"],
  describe: UI.t("cli.plugin_install"),
  builder: (yargs) =>
    yargs
      .positional("module", {
        type: "string",
        describe: UI.t("cli.npm_module"),
      })
      .option("global", {
        alias: ["g"],
        type: "boolean",
        default: false,
        describe: UI.t("cli.global_config"),
      })
      .option("force", {
        alias: ["f"],
        type: "boolean",
        default: false,
        describe: UI.t("cli.replace_plugin"),
      }),
  handler: Effect.fn("Cli.plug")(function* (args) {
    const mod = String(args.module ?? "").trim()
    if (!mod) {
      UI.error(UI.t("cli.module_required"))
      process.exitCode = 1
      return
    }

    UI.empty()
    intro(UI.t("plugin.cli.install_title", { mod }))

    const run = createPlugTask({
      mod,
      global: Boolean(args.global),
      force: Boolean(args.force),
    })

    const ctx = yield* InstanceRef
    if (!ctx) return
    const ok = yield* Effect.promise(() =>
      run({
        vcs: ctx.project.vcs,
        worktree: ctx.worktree,
        directory: ctx.directory,
      }),
    )

    outro(UI.t("plugin.cli.done"))
    if (!ok) process.exitCode = 1
  }),
})
