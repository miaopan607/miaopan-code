import { describe, expect, test } from "bun:test"
import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { Effect, Layer } from "effect"
import type { Agent } from "../../src/agent/agent"
import { NamedError } from "@miaopan-code/core/util/error"
import { Skill } from "../../src/skill"
import { Permission } from "../../src/permission"
import type { Provider } from "../../src/provider/provider"
import { SystemPrompt } from "../../src/session/system"
import { MCP } from "../../src/mcp"
import { testEffect } from "../lib/effect"

const skills: Skill.Info[] = [
  {
    name: "zeta-skill",
    description: "Zeta skill.",
    location: "/tmp/zeta-skill/SKILL.md",
    content: "# zeta-skill",
  },
  {
    name: "alpha-skill",
    description: "Alpha skill.",
    location: "/tmp/alpha-skill/SKILL.md",
    content: "# alpha-skill",
  },
  {
    name: "middle-skill",
    description: "Middle skill.",
    location: "/tmp/middle-skill/SKILL.md",
    content: "# middle-skill",
  },
  {
    name: "manual-skill",
    location: "/tmp/manual-skill/SKILL.md",
    content: "# manual-skill",
  },
]

const build: Agent.Info = {
  name: "build",
  mode: "primary",
  permission: Permission.fromConfig({ "*": "allow" }),
  options: {},
}

const ask: Agent.Info = {
  ...build,
  name: "ask",
}

const it = testEffect(
  LayerNode.compile(SystemPrompt.node, [
    [
      MCP.node,
      Layer.mock(MCP.Service, {
        instructions: () =>
          Effect.succeed([
            {
              name: "guide-server",
              instructions: "Use lookup before mutate.",
              tools: [],
            },
            {
              name: "tool-server",
              instructions: "Prefer search before update.",
              tools: ["tool-server_search", "tool-server_update"],
            },
          ]),
      }),
    ],
    [
      Skill.node,
      Layer.succeed(
        Skill.Service,
        Skill.Service.of({
          get: (name) => Effect.succeed(skills.find((skill) => skill.name === name)),
          require: (name) => {
            const info = skills.find((skill) => skill.name === name)
            if (info) return Effect.succeed(info)
            return Effect.fail(new Skill.NotFoundError({ name, available: skills.map((skill) => skill.name) }))
          },
          all: () => Effect.succeed(skills),
          dirs: () => Effect.succeed([]),
          available: () => Effect.succeed(skills),
        }),
      ),
    ],
  ]),
)

describe("session.system", () => {
  test("selects the Meta prompt for Muse Spark model IDs", () => {
    expect(SystemPrompt.provider({ api: { id: "meta/muse-spark-preview" } } as Provider.Model)[0]).toContain(
      "Meta Muse Spark",
    )
  })

  for (const id of ["gpt-5.6-sol", "openai/gpt-5.6-terra", "gpt-5-6-luna", "gpt-5.10-codex-next"]) {
    test(`selects the GPT-5.6+ prompt for ${id}`, () => {
      const model = { id, api: { id } } as Provider.Model
      expect(SystemPrompt.provider(model)[0]).toContain("授权边界")
      expect(SystemPrompt.provider(model, "en")[0]).toContain("Authorization boundaries")
    })
  }

  test("keeps GPT-5.5 on the general GPT prompt", () => {
    const prompt = SystemPrompt.provider({ id: "gpt-5.5", api: { id: "gpt-5.5" } } as Provider.Model)[0]
    expect(prompt).not.toContain("授权边界")
    expect(prompt).toContain("自主性与坚持")
  })

  test("uses the configured model ID when the API ID is an alias", () => {
    const prompt = SystemPrompt.provider({
      id: "openai/gpt-5.6-sol",
      api: { id: "company-coder" },
    } as Provider.Model)[0]
    expect(prompt).toContain("授权边界")
  })

  test("renders the Ultra mode in both languages", () => {
    expect(SystemPrompt.ultra()).toContain("主动多代理委派模式已启用")
    expect(SystemPrompt.ultra("en")).toContain("Proactive multi-agent delegation is active")
  })

  it.instance("uses the ask prompt only for ask agents", () =>
    Effect.gen(function* () {
      const prompt = yield* SystemPrompt.Service
      const direct = yield* prompt.collaboration(ask)
      const delegated = yield* prompt.collaboration({ ...build, name: "general" })

      expect(direct).toContain("协作模式：Ask")
      expect(direct).toContain("不要实施修改")
      expect(direct).not.toContain("<proposed_plan>")
      expect(delegated).toBeUndefined()
    }),
  )

  it.instance("skills output is sorted by name and stable across calls", () =>
    Effect.gen(function* () {
      const prompt = yield* SystemPrompt.Service
      const first = yield* prompt.skills(build)
      const second = yield* prompt.skills(build)
      const output = first ?? (yield* Effect.fail(new NamedError.Unknown({ message: "missing skills output" })))

      expect(first).toBe(second)

      const alpha = output.indexOf("<name>alpha-skill</name>")
      const middle = output.indexOf("<name>middle-skill</name>")
      const zeta = output.indexOf("<name>zeta-skill</name>")

      expect(alpha).toBeGreaterThan(-1)
      expect(middle).toBeGreaterThan(alpha)
      expect(zeta).toBeGreaterThan(middle)
      expect(output).not.toContain("manual-skill")
    }),
  )

  it.instance("MCP output includes connected server instructions", () =>
    Effect.gen(function* () {
      const prompt = yield* SystemPrompt.Service
      const output = yield* prompt.mcp(build)

      expect(output).toBe(
        [
          "<mcp_instructions>",
          '  <server name="guide-server">',
          "    Use lookup before mutate.",
          "  </server>",
          '  <server name="tool-server">',
          "    Prefer search before update.",
          "  </server>",
          "</mcp_instructions>",
        ].join("\n"),
      )
    }),
  )

  it.instance("MCP output omits servers when all advertised tools are denied", () =>
    Effect.gen(function* () {
      const prompt = yield* SystemPrompt.Service
      const output = yield* prompt.mcp(build, Permission.fromConfig({ "tool-server_*": "deny" }))

      expect(output).toBe(
        [
          "<mcp_instructions>",
          '  <server name="guide-server">',
          "    Use lookup before mutate.",
          "  </server>",
          "</mcp_instructions>",
        ].join("\n"),
      )
    }),
  )
})
