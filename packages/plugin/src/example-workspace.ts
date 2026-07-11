import type { Plugin } from "@miaopan-code/plugin"
import { mkdir, rm } from "node:fs/promises"
import { resolveLanguage, t } from "./i18n.js"

export const FolderWorkspacePlugin: Plugin = async ({ experimental_workspace }, options) => {
  const language = resolveLanguage(options?.language)
  experimental_workspace.register("folder", {
    name: t(language, "folder_workspace_name"),
    description: t(language, "folder_workspace_description"),
    configure(config) {
      const rand = "" + Math.random()

      return {
        ...config,
        directory: `/tmp/folder/folder-${rand}`,
      }
    },
    async create(config) {
      if (!config.directory) return
      await mkdir(config.directory, { recursive: true })
    },
    async remove(config) {
      await rm(config.directory!, { recursive: true, force: true })
    },
    target(config) {
      return {
        type: "local",
        directory: config.directory!,
      }
    },
  })

  return {}
}

export default FolderWorkspacePlugin
