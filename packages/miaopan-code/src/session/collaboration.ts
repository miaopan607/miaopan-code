import { PermissionV1 } from "@miaopan-code/core/v1/permission"
import type { Agent } from "@/agent/agent"
import { Permission } from "@/permission"

export type Mode = "build" | "plan" | "ask"

export const MODE_METADATA_KEY = "collaboration_mode"
export const PERMISSION_VERSION_METADATA_KEY = "permission_version"
export const CURRENT_PERMISSION_VERSION = 2

const MODES = new Set<Mode>(["build", "plan", "ask"])

const PLAN_MODE_PERMISSION = Permission.fromConfig({
  question: "deny",
  todowrite: "deny",
  create_goal: "deny",
  update_goal: "deny",
  edit: { "*": "deny" },
})

const PLAN_SUBAGENT_PERMISSION = Permission.fromConfig({
  request_user_input: "deny",
})

export const LEGACY_PLAN_PERMISSION = Permission.fromConfig({
  question: "deny",
  request_user_input: "deny",
  todowrite: "deny",
  create_goal: "deny",
  update_goal: "deny",
  edit: { "*": "deny" },
})

export const LEGACY_ASK_PERMISSION = Permission.fromConfig({
  edit: { "*": "deny" },
})

const ASK_MODE_PERMISSION = LEGACY_ASK_PERMISSION

export function mode(value: unknown): value is Mode {
  return typeof value === "string" && MODES.has(value as Mode)
}

export function legacyModePermission(value: Mode | undefined) {
  if (value === "plan") return LEGACY_PLAN_PERMISSION
  if (value === "ask") return LEGACY_ASK_PERMISSION
  return []
}

export function removeLegacyModePermission(ruleset: PermissionV1.Ruleset, value: Mode | undefined, start: number) {
  const legacy = legacyModePermission(value)
  if (legacy.length === 0) return [...ruleset]
  if (
    legacy.some((rule, offset) => {
      const candidate = ruleset[start + offset]
      return (
        candidate?.permission !== rule.permission ||
        candidate.pattern !== rule.pattern ||
        candidate.action !== rule.action
      )
    })
  )
    return [...ruleset]
  return [...ruleset.slice(0, start), ...ruleset.slice(start + legacy.length)]
}

export function resolveMode(
  agent: Pick<Agent.Info, "name" | "mode">,
  session: { parentID?: string; metadata?: Record<string, unknown> },
): Mode | undefined {
  if (agent.name === "build" || agent.name === "plan" || agent.name === "ask") return agent.name
  if (agent.mode === "primary" || !session.parentID) return undefined
  const value = session.metadata?.[MODE_METADATA_KEY]
  return mode(value) ? value : undefined
}

export function modePermission(mode: Mode | undefined, agent: Pick<Agent.Info, "mode">) {
  if (mode === "plan") {
    return agent.mode === "primary"
      ? PLAN_MODE_PERMISSION
      : Permission.merge(PLAN_MODE_PERMISSION, PLAN_SUBAGENT_PERMISSION)
  }
  if (mode === "ask") return ASK_MODE_PERMISSION
  return []
}

export function effectivePermission(input: {
  agent: Agent.Info
  session: { parentID?: string; metadata?: Record<string, unknown>; permission?: PermissionV1.Ruleset }
}) {
  const collaborationMode = resolveMode(input.agent, input.session)
  return Permission.merge(
    input.agent.permission,
    input.session.permission ?? [],
    modePermission(collaborationMode, input.agent),
  )
}

export function replaceModeMetadata(metadata: Record<string, unknown> | undefined, value: Mode | undefined) {
  const next = { ...metadata }
  delete next[MODE_METADATA_KEY]
  if (value && value !== "build") next[MODE_METADATA_KEY] = value
  return Object.keys(next).length > 0 ? next : undefined
}

export function markPermissionVersion(metadata: Record<string, unknown> | undefined, value: Mode | undefined) {
  const next = replaceModeMetadata(metadata, value) ?? {}
  next[PERMISSION_VERSION_METADATA_KEY] = CURRENT_PERMISSION_VERSION
  return next
}

export function withoutInternalMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return undefined
  const next = { ...metadata }
  delete next[MODE_METADATA_KEY]
  delete next[PERMISSION_VERSION_METADATA_KEY]
  return Object.keys(next).length > 0 ? next : undefined
}

export function hasPermissionVersion(metadata: Record<string, unknown> | undefined) {
  return metadata?.[PERMISSION_VERSION_METADATA_KEY] === CURRENT_PERMISSION_VERSION
}

export * as Collaboration from "./collaboration"
