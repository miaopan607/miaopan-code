import { PermissionV1 } from "@miaopan-code/core/v1/permission"
import type { Agent } from "./agent"
import { Permission } from "../permission"

export function deriveSubagentSessionPermission(input: {
  parentSessionPermission: PermissionV1.Ruleset
  subagent: Agent.Info
  planMode?: boolean
}): PermissionV1.Ruleset {
  const canTask = input.subagent.permission.some((rule) => rule.permission === "task")
  const canTodo = input.subagent.permission.some((rule) => rule.permission === "todowrite")
  return [
    ...input.parentSessionPermission.filter(
      (rule) => rule.permission === "external_directory" || rule.action === "deny",
    ),
    ...(input.planMode
      ? Permission.fromConfig({
          question: "deny",
          request_user_input: "deny",
          todowrite: "deny",
          create_goal: "deny",
          update_goal: "deny",
          edit: "deny",
        })
      : []),
    ...(canTodo ? [] : [{ permission: "todowrite" as const, pattern: "*" as const, action: "deny" as const }]),
    ...(canTask ? [] : [{ permission: "task" as const, pattern: "*" as const, action: "deny" as const }]),
  ]
}
