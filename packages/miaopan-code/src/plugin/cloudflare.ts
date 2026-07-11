import type { Hooks, PluginInput } from "@miaopan-code/plugin"
import { t } from "@miaopan-code/core/i18n"
import { pluginLanguage } from "./language"

export async function CloudflareWorkersAuthPlugin(
  _input: PluginInput,
  options?: Record<string, unknown>,
): Promise<Hooks> {
  const language = pluginLanguage(options)
  const prompts = !process.env.CLOUDFLARE_ACCOUNT_ID
    ? [
        {
          type: "text" as const,
          key: "accountId",
          message: t(language, "plugin.cloudflare.account_id"),
          placeholder: t(language, "plugin.example.cloudflare_account"),
        },
      ]
    : []

  return {
    auth: {
      provider: "cloudflare-workers-ai",
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

export async function CloudflareAIGatewayAuthPlugin(
  _input: PluginInput,
  options?: Record<string, unknown>,
): Promise<Hooks> {
  const language = pluginLanguage(options)
  const prompts = [
    ...(!process.env.CLOUDFLARE_ACCOUNT_ID
      ? [
          {
            type: "text" as const,
            key: "accountId",
            message: t(language, "plugin.cloudflare.account_id"),
            placeholder: t(language, "plugin.example.cloudflare_account"),
          },
        ]
      : []),
    ...(!process.env.CLOUDFLARE_GATEWAY_ID
      ? [
          {
            type: "text" as const,
            key: "gatewayId",
            message: t(language, "plugin.cloudflare.gateway_id"),
            placeholder: t(language, "plugin.example.cloudflare_gateway"),
          },
        ]
      : []),
  ]

  return {
    auth: {
      provider: "cloudflare-ai-gateway",
      methods: [
        {
          type: "api",
          label: t(language, "plugin.cloudflare.gateway_token"),
          prompts,
        },
      ],
    },
    "chat.params": async (input, output) => {
      if (input.model.providerID !== "cloudflare-ai-gateway") return
      // The unified gateway routes through @ai-sdk/openai-compatible, which
      // always emits max_tokens. OpenAI reasoning models (gpt-5.x, o-series)
      // reject that field and require max_completion_tokens instead, and the
      // compatible SDK has no way to rename it. Drop the cap so OpenAI falls
      // back to the model's default output budget.
      if (!input.model.api.id.toLowerCase().startsWith("openai/")) return
      if (!input.model.capabilities.reasoning) return
      output.maxOutputTokens = undefined
    },
  }
}
