import { describe, expect, test } from "bun:test"
import type { Agent } from "@/agent/agent"
import { Collaboration } from "../../src/session/collaboration"
import { Permission } from "../../src/permission"

const permission = Permission.fromConfig({ "*": "allow" })

function agent(name: string, mode: Agent.Info["mode"]): Agent.Info {
  return { name, mode, permission, options: {} }
}

describe("session.collaboration", () => {
  test("prioritizes explicit collaboration agents", () => {
    expect(Collaboration.resolveMode(agent("plan", "primary"), { metadata: { collaboration_mode: "ask" } })).toBe(
      "plan",
    )
    expect(Collaboration.resolveMode(agent("build", "primary"), { metadata: { collaboration_mode: "plan" } })).toBe(
      "build",
    )
    expect(Collaboration.resolveMode(agent("ask", "primary"), { metadata: { collaboration_mode: "plan" } })).toBe("ask")
  })

  test("does not inherit metadata for roots or other primary agents", () => {
    expect(Collaboration.resolveMode(agent("general", "all"), { metadata: { collaboration_mode: "plan" } })).toBe(
      undefined,
    )
    expect(
      Collaboration.resolveMode(agent("title", "primary"), {
        parentID: "parent",
        metadata: { collaboration_mode: "plan" },
      }),
    ).toBe(undefined)
  })

  test("inherits metadata only for child subagent sessions", () => {
    expect(
      Collaboration.resolveMode(agent("general", "all"), {
        parentID: "parent",
        metadata: { collaboration_mode: "plan" },
      }),
    ).toBe("plan")
    expect(
      Collaboration.resolveMode(agent("explore", "subagent"), {
        parentID: "parent",
        metadata: { collaboration_mode: "ask" },
      }),
    ).toBe("ask")
  })

  test("appends mode restrictions after the shared session permission", () => {
    const edit = Permission.evaluate(
      "edit",
      "src/index.ts",
      Collaboration.effectivePermission({
        agent: agent("general", "subagent"),
        session: {
          parentID: "parent",
          metadata: { collaboration_mode: "plan" },
          permission: Permission.fromConfig({ edit: "allow" }),
        },
      }),
    )
    expect(edit.action).toBe("deny")

    const ask = Permission.evaluate(
      "edit",
      "src/index.ts",
      Collaboration.effectivePermission({
        agent: agent("ask", "primary"),
        session: {},
      }),
    )
    expect(ask.action).toBe("deny")
  })

  test("removes internal mode metadata without touching ordinary metadata", () => {
    const metadata = {
      source: "test",
      collaboration_mode: "plan",
      permission_version: Collaboration.CURRENT_PERMISSION_VERSION,
    }

    expect(Collaboration.replaceModeMetadata(metadata, "build")).toEqual({
      source: "test",
      permission_version: Collaboration.CURRENT_PERMISSION_VERSION,
    })
    expect(Collaboration.withoutInternalMetadata(metadata)).toEqual({ source: "test" })
  })

  test("removes only an exact legacy mode segment at the expected position", () => {
    const rules = [
      { permission: "bash", pattern: "*", action: "deny" as const },
      ...Collaboration.LEGACY_PLAN_PERMISSION,
      { permission: "task", pattern: "*", action: "deny" as const },
    ]

    expect(Collaboration.removeLegacyModePermission(rules, "plan", 1)).toEqual([rules[0], rules[rules.length - 1]])
    expect(Collaboration.removeLegacyModePermission(rules, "plan", 0)).toEqual(rules)
    expect(Collaboration.removeLegacyModePermission(rules, undefined, 1)).toEqual(rules)
  })
})
