import { EOL } from "os"
import { cmd } from "../cmd"
import { UI } from "@/cli/ui"

export const ScrapCommand = cmd({
  command: "scrap",
  describe: UI.t("cli.list_files"),
  builder: (yargs) => yargs,
  async handler() {
    const { Project } = await import("@/project/project")
    const { AppNodeBuilder } = await import("@miaopan-code/core/effect/app-node-builder")
    const { makeRuntime } = await import("@miaopan-code/core/effect/runtime")
    const runtime = makeRuntime(Project.Service, AppNodeBuilder.build(Project.node))
    const list = await runtime.runPromise((project) => project.list())
    process.stdout.write(JSON.stringify(list, null, 2) + EOL)
  },
})
