import type { Argv } from "yargs"
import { UI } from "../ui"
import * as prompts from "@clack/prompts"
import { Installation } from "../../installation"
import { InstallationVersion } from "@miaopan-code/core/installation/version"

export const UpgradeCommand = {
  command: "upgrade [target]",
  describe: UI.t("cli.upgrade"),
  builder: (yargs: Argv) => {
    return yargs
      .positional("target", {
        describe: UI.t("cli.version_target"),
        type: "string",
      })
      .option("method", {
        alias: "m",
        describe: UI.t("cli.install_method"),
        type: "string",
        choices: ["curl", "npm", "pnpm", "bun", "choco", "scoop"],
      })
  },
  handler: async (args: { target?: string; method?: string }) => {
    UI.empty()
    prompts.intro(UI.t("upgrade.title"))
    const detectedMethod = await Installation.method()
    const method = (args.method as Installation.Method) ?? detectedMethod
    if (method === "unknown") {
      prompts.log.error(UI.t("upgrade.package_manager_hint", { path: process.execPath }))
      const install = await prompts.select({
        message: UI.t("upgrade.install_anyway"),
        options: [
          { label: UI.t("upgrade.yes"), value: true },
          { label: UI.t("upgrade.no"), value: false },
        ],
        initialValue: false,
      })
      if (!install) {
        prompts.outro(UI.t("mcp.done"))
        return
      }
    }
    prompts.log.info(UI.t("upgrade.using_method", { method }))
    const target = args.target ? args.target.replace(/^v/, "") : await Installation.latest()

    if (InstallationVersion === target) {
      prompts.log.warn(UI.t("upgrade.skipped", { target }))
      prompts.outro(UI.t("mcp.done"))
      return
    }

    prompts.log.info(UI.t("upgrade.from_to", { from: InstallationVersion, to: target }))
    const spinner = prompts.spinner()
    spinner.start(UI.t("upgrade.in_progress"))
    const err = await Installation.upgrade(method, target).catch((err) => err)
    if (err) {
      spinner.stop(UI.t("upgrade.failed"), 1)
      if (err instanceof Installation.UpgradeFailedError) {
        // necessary because choco only allows install/upgrade in elevated terminals
        if (method === "choco" && err.stderr.includes("not running from an elevated command shell")) {
          prompts.log.error(UI.t("upgrade.admin_required"))
        } else {
          prompts.log.error(err.stderr)
        }
      } else if (err instanceof Error) prompts.log.error(err.message)
      prompts.outro(UI.t("mcp.done"))
      return
    }
    spinner.stop(UI.t("upgrade.complete"))
    prompts.outro(UI.t("mcp.done"))
  },
}
