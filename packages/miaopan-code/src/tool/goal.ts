import { PositiveInt } from "@miaopan-code/core/schema"
import { SessionGoal } from "@miaopan-code/core/session/goal"
import { type Language } from "@miaopan-code/core/i18n"
import { Effect, Schema } from "effect"
import { ToolI18n } from "./i18n"
import { Tool } from "./tool"

const MAX_OBJECTIVE_CHARS = 4_000

const makeCreateParameters = (language?: Language) =>
  Schema.Struct({
    objective: Schema.String.annotate({ description: ToolI18n.text({ language }, "tool.param.goal_objective") }),
    token_budget: Schema.optional(PositiveInt).annotate({
      description: ToolI18n.text({ language }, "tool.param.goal_token_budget"),
    }),
  })

const CreateParameters = makeCreateParameters()
const GetParameters = Schema.Struct({})
const UpdateParameters = Schema.Struct({
  status: Schema.Literals(["complete", "blocked"]),
})

export const CreateGoalTool = Tool.define(
  "create_goal",
  Effect.gen(function* () {
    const language = yield* ToolI18n.language()
    const goals = yield* SessionGoal.Service
    return {
      description: yield* ToolI18n.configuredText("tool.description.create_goal"),
      parameters: makeCreateParameters(language),
      execute: (params: Schema.Schema.Type<typeof CreateParameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const objective = params.objective.trim()
          if (!objective) return result(ctx, "tool.goal_invalid_objective")
          if (Array.from(objective).length > MAX_OBJECTIVE_CHARS) {
            return result(ctx, "tool.goal_objective_too_long")
          }
          const created = yield* goals.create({
            sessionID: ctx.sessionID,
            objective,
            tokenBudget: params.token_budget,
          })
          if (created.type === "session_not_found") return result(ctx, "tool.goal_session_not_found")
          if (created.type === "unfinished") {
            return result(ctx, "tool.goal_unfinished", { goal: created.goal })
          }
          return result(ctx, "tool.goal_created", { goal: created.goal })
        }),
    }
  }),
)

export const GetGoalTool = Tool.define(
  "get_goal",
  Effect.gen(function* () {
    const goals = yield* SessionGoal.Service
    return {
      description: yield* ToolI18n.configuredText("tool.description.get_goal"),
      parameters: GetParameters,
      execute: (_params: Schema.Schema.Type<typeof GetParameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const goal = yield* goals.get(ctx.sessionID)
          if (!goal) return result(ctx, "tool.goal_missing")
          return result(ctx, "tool.goal_current", { goal })
        }),
    }
  }),
)

export const UpdateGoalTool = Tool.define(
  "update_goal",
  Effect.gen(function* () {
    const goals = yield* SessionGoal.Service
    return {
      description: yield* ToolI18n.configuredText("tool.description.update_goal"),
      parameters: UpdateParameters,
      execute: (params: Schema.Schema.Type<typeof UpdateParameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const goal = yield* goals.update({ sessionID: ctx.sessionID, status: params.status })
          if (!goal) return result(ctx, "tool.goal_missing")
          return result(ctx, "tool.goal_updated", { goal })
        }),
    }
  }),
)

function result(ctx: Tool.Context, key: Parameters<typeof ToolI18n.text>[1], data?: Record<string, unknown>) {
  const message = ToolI18n.text(ctx, key)
  return {
    title: message,
    output: JSON.stringify({ message, ...data }, null, 2),
    metadata: {},
  }
}
