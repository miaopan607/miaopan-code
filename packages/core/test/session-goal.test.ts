import { describe, expect } from "bun:test"
import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { Database } from "@miaopan-code/core/database/database"
import { AppNodeBuilder } from "@miaopan-code/core/effect/app-node-builder"
import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { Project } from "@miaopan-code/core/project"
import { ProjectTable } from "@miaopan-code/core/project/sql"
import { AbsolutePath } from "@miaopan-code/core/schema"
import { SessionGoal } from "@miaopan-code/core/session/goal"
import { SessionGoalTable } from "@miaopan-code/core/session/goal.sql"
import { SessionV2 } from "@miaopan-code/core/session"
import { SessionTable } from "@miaopan-code/core/session/sql"
import { testEffect } from "./lib/effect"

const it = testEffect(AppNodeBuilder.build(LayerNode.group([Database.node, SessionGoal.node])))
const sessionID = SessionV2.ID.make("ses_goal_test")

const setup = Effect.gen(function* () {
  const { db } = yield* Database.Service
  yield* db
    .insert(ProjectTable)
    .values({ id: Project.ID.global, worktree: AbsolutePath.make("/project"), sandboxes: [] })
    .run()
    .pipe(Effect.orDie)
  yield* db
    .insert(SessionTable)
    .values({
      id: sessionID,
      project_id: Project.ID.global,
      slug: "goal",
      directory: "/project",
      title: "goal",
      version: "test",
      tokens_input: 10,
    })
    .run()
    .pipe(Effect.orDie)
})

describe("SessionGoal", () => {
  it.effect("settles terminal usage and allows terminal goals to be replaced", () =>
    Effect.gen(function* () {
      yield* setup
      const { db } = yield* Database.Service
      const goals = yield* SessionGoal.Service

      const created = yield* goals.create({ sessionID, objective: "ship goal support", tokenBudget: 100 })
      expect(created).toMatchObject({
        type: "created",
        goal: { objective: "ship goal support", status: "active", tokenBudget: 100, tokensUsed: 0 },
      })
      expect(yield* goals.create({ sessionID, objective: "replace too early" })).toMatchObject({
        type: "unfinished",
        goal: { objective: "ship goal support" },
      })

      yield* db
        .update(SessionGoalTable)
        .set({ tokens_used: 40 })
        .where(eq(SessionGoalTable.session_id, sessionID))
        .run()
        .pipe(Effect.orDie)
      expect(yield* goals.get(sessionID)).toMatchObject({ status: "active", tokensUsed: 40, remainingTokens: 60 })

      yield* db
        .update(SessionGoalTable)
        .set({ time_updated: 0 })
        .where(eq(SessionGoalTable.session_id, sessionID))
        .run()
        .pipe(Effect.orDie)
      const completed = yield* goals.update({ sessionID, status: "complete" })
      expect(completed).toMatchObject({ status: "complete", tokensUsed: 40 })
      expect(completed?.updatedAt).toBeGreaterThan(0)
      yield* db
        .update(SessionGoalTable)
        .set({ tokens_used: 70 })
        .where(eq(SessionGoalTable.session_id, sessionID))
        .run()
        .pipe(Effect.orDie)
      expect(yield* goals.settle(sessionID)).toMatchObject({ status: "complete", tokensUsed: 70 })
      expect(yield* goals.get(sessionID)).toMatchObject({ status: "complete", tokensUsed: 70 })

      expect(yield* goals.create({ sessionID, objective: "replacement", tokenBudget: 20 })).toMatchObject({
        type: "created",
        goal: { objective: "replacement", status: "active", tokensUsed: 0 },
      })
      yield* db
        .update(SessionGoalTable)
        .set({ tokens_used: 25 })
        .where(eq(SessionGoalTable.session_id, sessionID))
        .run()
        .pipe(Effect.orDie)
      expect(yield* goals.get(sessionID)).toMatchObject({
        status: "budget_limited",
        tokensUsed: 25,
        remainingTokens: 0,
      })
      expect(yield* goals.create({ sessionID, objective: "after budget limit" })).toMatchObject({
        type: "created",
        goal: { objective: "after budget limit", status: "active" },
      })
      yield* goals.update({ sessionID, status: "blocked" })
      expect(yield* goals.create({ sessionID, objective: "after blocked" })).toMatchObject({
        type: "created",
        goal: { objective: "after blocked", status: "active" },
      })
    }),
  )
})
