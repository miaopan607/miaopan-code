import { type LanguageModelV3CallOptions, type SharedV3Warning, UnsupportedFunctionalityError } from "@ai-sdk/provider"
import { t, type Language } from "../../i18n"

export function prepareTools({
  tools,
  toolChoice,
  language,
}: {
  tools: LanguageModelV3CallOptions["tools"]
  toolChoice?: LanguageModelV3CallOptions["toolChoice"]
  language?: Language
}): {
  tools:
    | undefined
    | Array<{
        type: "function"
        function: {
          name: string
          description: string | undefined
          parameters: unknown
        }
      }>
  toolChoice: { type: "function"; function: { name: string } } | "auto" | "none" | "required" | undefined
  toolWarnings: SharedV3Warning[]
} {
  // when the tools array is empty, change it to undefined to prevent errors:
  tools = tools?.length ? tools : undefined

  const toolWarnings: SharedV3Warning[] = []

  if (tools == null) {
    return { tools: undefined, toolChoice: undefined, toolWarnings }
  }

  const openaiCompatTools: Array<{
    type: "function"
    function: {
      name: string
      description: string | undefined
      parameters: unknown
    }
  }> = []

  for (const tool of tools) {
    if (tool.type === "provider") {
      toolWarnings.push({ type: "unsupported", feature: t(language, "warning.copilot_tool_type", { type: tool.type }) })
    } else {
      openaiCompatTools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      })
    }
  }

  if (toolChoice == null) {
    return { tools: openaiCompatTools, toolChoice: undefined, toolWarnings }
  }

  const type = toolChoice.type

  switch (type) {
    case "auto":
    case "none":
    case "required":
      return { tools: openaiCompatTools, toolChoice: type, toolWarnings }
    case "tool":
      return {
        tools: openaiCompatTools,
        toolChoice: {
          type: "function",
          function: { name: toolChoice.toolName },
        },
        toolWarnings,
      }
    default: {
      const _exhaustiveCheck: never = type
      throw new UnsupportedFunctionalityError({
        functionality: t(language, "error.copilot_tool_choice_type", { type: _exhaustiveCheck }),
      })
    }
  }
}
