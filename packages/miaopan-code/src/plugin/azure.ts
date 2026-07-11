import type { Hooks, PluginInput } from "@miaopan/plugin"
import { t } from "@miaopan-code/core/i18n"
import { pluginLanguage } from "./language"

export async function AzureAuthPlugin(_input: PluginInput, options?: Record<string, unknown>): Promise<Hooks> {
  const language = pluginLanguage(options)
  const prompts = []
  if (!process.env.AZURE_RESOURCE_NAME) {
    prompts.push({
      type: "text" as const,
      key: "resourceName",
      message: t(language, "plugin.azure.resource_name"),
      placeholder: t(language, "plugin.example.azure_resource"),
    })
  }

  return {
    auth: {
      provider: "azure",
      methods: [
        {
          type: "api",
          label: t(language, "plugin.api_key"),
          prompts,
        },
      ],
    },
  }
}
