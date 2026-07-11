import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { Context, Effect, Layer } from "effect"

import { InstanceState } from "@/effect/instance-state"

import type { Language } from "@miaopan-code/core/i18n"
import type { Provider } from "@/provider/provider"
import type { Agent } from "@/agent/agent"
import { Permission } from "@/permission"
import { Skill } from "@/skill"
import { AbsolutePath } from "@miaopan-code/core/schema"
import { Location } from "@miaopan-code/core/location"
import { LocationServiceMap, locationServiceMapLayer } from "@miaopan-code/core/location-services"
import { Reference } from "@miaopan-code/core/reference"
import { MCP } from "@/mcp"
import { PermissionV1 } from "@miaopan-code/core/v1/permission"
import { Config } from "@/config/config"
import { t } from "@miaopan-code/core/i18n"
import { PromptI18n, type PromptKey } from "@/i18n/prompt"

export function provider(model: Provider.Model, language: Language = "zh-CN") {
  const text = (key: PromptKey) => [PromptI18n.text(language, key)]
  if (model.api.id.includes("muse-spark")) return text("session.meta")
  if (model.api.id.includes("gpt-4") || model.api.id.includes("o1") || model.api.id.includes("o3"))
    return text("session.beast")
  if (model.api.id.includes("gpt")) {
    if (model.api.id.includes("codex")) {
      return text("session.codex")
    }
    return text("session.gpt")
  }
  if (model.api.id.includes("gemini-")) return text("session.gemini")
  if (model.api.id.includes("claude")) return text("session.anthropic")
  if (model.api.id.toLowerCase().includes("trinity")) return text("session.trinity")
  if (model.api.id.toLowerCase().includes("kimi")) return text("session.kimi")
  return text("session.default")
}

export interface Interface {
  readonly environment: (model: Provider.Model) => Effect.Effect<string[]>
  readonly collaboration: (agent: Agent.Info, planMode?: boolean) => Effect.Effect<string | undefined>
  readonly skills: (agent: Agent.Info) => Effect.Effect<string | undefined>
  readonly mcp: (agent: Agent.Info, permission?: PermissionV1.Ruleset) => Effect.Effect<string | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/SystemPrompt") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const skill = yield* Skill.Service
    const mcp = yield* MCP.Service
    const locations = yield* LocationServiceMap.Service
    const config = yield* Config.Service

    return Service.of({
      collaboration: Effect.fn("SystemPrompt.collaboration")(function* (agent: Agent.Info, planMode?: boolean) {
        const language = (yield* config.get()).language
        if (agent.name === "plan" || planMode) {
          return `<collaboration_mode>\n${PromptI18n.text(language, "session.plan_mode")}\n</collaboration_mode>`
        }
        if (agent.name === "build") {
          return `<collaboration_mode>\n${PromptI18n.text(language, "session.build_switch")}\n</collaboration_mode>`
        }
      }),
      environment: Effect.fn("SystemPrompt.environment")(function* (model: Provider.Model) {
        const ctx = yield* InstanceState.context
        const language = (yield* config.get()).language
        const references = yield* Effect.gen(function* () {
          return (yield* (yield* Reference.Service).list()).filter((reference) => reference.description !== undefined)
        }).pipe(Effect.provide(locations.get(Location.Ref.make({ directory: AbsolutePath.make(ctx.directory) }))))
        return [
          [
            t(language, "prompt.environment_model", { model: model.api.id, id: `${model.providerID}/${model.api.id}` }),
            t(language, "prompt.environment_intro"),
            `<env>`,
            `  ${t(language, "prompt.environment_working_directory", { value: ctx.directory })}`,
            `  ${t(language, "prompt.environment_workspace_root", { value: ctx.worktree })}`,
            `  ${t(language, "prompt.environment_git_repo", {
              value: t(language, ctx.project.vcs === "git" ? "common.yes" : "common.no"),
            })}`,
            `  ${t(language, "prompt.environment_platform", { value: process.platform })}`,
            `  ${t(language, "prompt.environment_date", { value: new Date().toDateString() })}`,
            `</env>`,
          ].join("\n"),
          references.length === 0
            ? undefined
            : [
                t(language, "prompt.project_references"),
                "<available_references>",
                ...references
                  .toSorted((a, b) => a.name.localeCompare(b.name))
                  .flatMap((reference) => [
                    "  <reference>",
                    `    <name>${reference.name}</name>`,
                    `    <path>${reference.path}</path>`,
                    ...(reference.description === undefined
                      ? []
                      : [`    <description>${reference.description}</description>`]),
                    "  </reference>",
                  ]),
                "</available_references>",
              ].join("\n"),
        ].filter((part): part is string => part !== undefined)
      }),

      skills: Effect.fn("SystemPrompt.skills")(function* (agent: Agent.Info) {
        if (Permission.disabled(["skill"], agent.permission).has("skill")) return

        const list = yield* skill.available(agent)

        const language = (yield* config.get()).language
        return [
          ...t(language, "prompt.skill_guidance").split("\n"),
          // the agents seem to ingest the information about skills a bit better if we present a more verbose
          // version of them here and a less verbose version in tool description, rather than vice versa.
          Skill.fmt(list, { verbose: true, language }),
        ].join("\n")
      }),

      mcp: Effect.fn("SystemPrompt.mcp")(function* (agent: Agent.Info, permission?: PermissionV1.Ruleset) {
        const ruleset = Permission.merge(agent.permission, permission ?? [])
        const instructions = (yield* mcp.instructions()).filter(
          (item) => item.tools.length === 0 || Permission.disabled(item.tools, ruleset).size < item.tools.length,
        )
        if (instructions.length === 0) return

        return [
          "<mcp_instructions>",
          ...instructions.flatMap((item) => [
            `  <server name="${item.name}">`,
            ...item.instructions.split("\n").map((line) => `    ${line}`),
            "  </server>",
          ]),
          "</mcp_instructions>",
        ].join("\n")
      }),
    })
  }),
)

const locationServiceMapNode = LayerNode.make({
  service: LocationServiceMap.Service,
  layer: locationServiceMapLayer,
  deps: [],
})

export const node = LayerNode.make({
  service: Service,
  layer: layer,
  deps: [Skill.node, MCP.node, locationServiceMapNode, Config.node],
})

export * as SystemPrompt from "./system"
