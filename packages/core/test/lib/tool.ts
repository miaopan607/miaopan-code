import { AgentV2 } from "@miaopan-code/core/agent"
import { SessionMessage } from "@miaopan-code/core/session/message"
import { ToolRegistry } from "@miaopan-code/core/tool/registry"
import type { Language } from "@miaopan-code/core/i18n"
import { Effect } from "effect"

export const toolIdentity = {
  agent: AgentV2.ID.make("build"),
  assistantMessageID: SessionMessage.ID.make("msg_tool_test"),
}

export const toolDefinitions = (
  registry: ToolRegistry.Interface,
  permissions?: Parameters<typeof registry.materialize>[0],
  language?: Language,
) => registry.materialize(permissions, language).pipe(Effect.map((materialized) => materialized.definitions))

export const settleTool = (registry: ToolRegistry.Interface, input: ToolRegistry.ExecuteInput, language?: Language) =>
  registry.materialize(undefined, language).pipe(Effect.flatMap((materialized) => materialized.settle(input)))

export const executeTool = (registry: ToolRegistry.Interface, input: ToolRegistry.ExecuteInput, language?: Language) =>
  settleTool(registry, input, language).pipe(Effect.map((settlement) => settlement.result))
