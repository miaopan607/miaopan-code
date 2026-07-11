import { eq } from "drizzle-orm"
import { Context, Effect, Layer, Schema } from "effect"
import { Database } from "../database/database"
import { makeGlobalNode } from "../effect/app-node"
import { SessionTable } from "./sql"
import { SessionGoalTable } from "./goal.sql"
import { SessionSchema } from "./schema"

export const Status = Schema.Literals(["active", "complete", "blocked", "budget_limited"])
export type Status = typeof Status.Type

export const Info = Schema.Struct({
  sessionID: SessionSchema.ID,
  objective: Schema.String,
  status: Status,
  tokenBudget: Schema.optional(Schema.Number),
  tokensUsed: Schema.Number,
  timeUsedMs: Schema.Number,
  remainingTokens: Schema.optional(Schema.Number),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
})
export type Info = typeof Info.Type

export type CreateResult =
  | { readonly type: "created"; readonly goal: Info }
  | { readonly type: "unfinished"; readonly goal: Info }
  | { readonly type: "session_not_found" }

export type RuntimeInfo = {
  readonly goal: Info
  readonly settlementPending: boolean
}

export interface Interface {
  readonly get: (sessionID: SessionSchema.ID) => Effect.Effect<Info | undefined>
  readonly runtime: (sessionID: SessionSchema.ID) => Effect.Effect<RuntimeInfo | undefined>
  readonly create: (input: {
    sessionID: SessionSchema.ID
    objective: string
    tokenBudget?: number
  }) => Effect.Effect<CreateResult>
  readonly update: (input: {
    sessionID: SessionSchema.ID
    status: "complete" | "blocked"
  }) => Effect.Effect<Info | undefined>
  readonly settle: (sessionID: SessionSchema.ID) => Effect.Effect<Info | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/SessionGoal") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const { db } = yield* Database.Service

    const runtime = Effect.fn("SessionGoal.runtime")(function* (sessionID: SessionSchema.ID) {
      return yield* db
        .transaction((tx) =>
          Effect.gen(function* () {
            const row = yield* tx
              .select()
              .from(SessionGoalTable)
              .where(eq(SessionGoalTable.session_id, sessionID))
              .get()
            if (!row) return undefined
            const current = materialize(row, Date.now())
            if (current.status !== "budget_limited" || row.status === "budget_limited") {
              return { goal: current, settlementPending: row.settlement_pending }
            }
            const updated = yield* tx
              .update(SessionGoalTable)
              .set({
                status: "budget_limited",
                time_used: current.timeUsedMs,
                active_since: null,
                settlement_pending: false,
                time_updated: current.updatedAt,
              })
              .where(eq(SessionGoalTable.session_id, sessionID))
              .returning()
              .get()
            return {
              goal: materialize(updated, current.updatedAt),
              settlementPending: updated.settlement_pending,
            }
          }),
        )
        .pipe(Effect.orDie)
    })

    const get = Effect.fn("SessionGoal.get")(function* (sessionID: SessionSchema.ID) {
      return (yield* runtime(sessionID))?.goal
    })

    const create = Effect.fn("SessionGoal.create")(function* (input: {
      sessionID: SessionSchema.ID
      objective: string
      tokenBudget?: number
    }) {
      return yield* db
        .transaction((tx) =>
          Effect.gen(function* () {
            const session = yield* tx.select().from(SessionTable).where(eq(SessionTable.id, input.sessionID)).get()
            if (!session) return { type: "session_not_found" as const }
            const existing = yield* tx
              .select()
              .from(SessionGoalTable)
              .where(eq(SessionGoalTable.session_id, input.sessionID))
              .get()
            if (existing) {
              const goal = materialize(existing, Date.now())
              if (goal.status === "active") return { type: "unfinished" as const, goal }
            }
            const now = Date.now()
            const row = yield* tx
              .insert(SessionGoalTable)
              .values({
                session_id: input.sessionID,
                objective: input.objective,
                status: "active",
                token_budget: input.tokenBudget,
                tokens_used: 0,
                time_used: 0,
                active_since: now,
                settlement_pending: false,
                time_created: now,
                time_updated: now,
              })
              .onConflictDoUpdate({
                target: SessionGoalTable.session_id,
                set: {
                  objective: input.objective,
                  status: "active",
                  token_budget: input.tokenBudget ?? null,
                  tokens_used: 0,
                  time_used: 0,
                  active_since: now,
                  settlement_pending: false,
                  time_created: now,
                  time_updated: now,
                },
              })
              .returning()
              .get()
            return { type: "created" as const, goal: materialize(row, now) }
          }),
        )
        .pipe(Effect.orDie)
    })

    const update = Effect.fn("SessionGoal.update")(function* (input: {
      sessionID: SessionSchema.ID
      status: "complete" | "blocked"
    }) {
      return yield* db
        .transaction((tx) =>
          Effect.gen(function* () {
            const row = yield* tx
              .select()
              .from(SessionGoalTable)
              .where(eq(SessionGoalTable.session_id, input.sessionID))
              .get()
            if (!row) return undefined
            const now = Date.now()
            const current = materialize(row, now)
            const updated = yield* tx
              .update(SessionGoalTable)
              .set({
                status: input.status,
                time_used: current.timeUsedMs,
                active_since: null,
                settlement_pending: true,
                time_updated: now,
              })
              .where(eq(SessionGoalTable.session_id, input.sessionID))
              .returning()
              .get()
            return materialize(updated, now)
          }),
        )
        .pipe(Effect.orDie)
    })

    const settle = Effect.fn("SessionGoal.settle")(function* (sessionID: SessionSchema.ID) {
      return yield* db
        .transaction((tx) =>
          Effect.gen(function* () {
            const row = yield* tx
              .select()
              .from(SessionGoalTable)
              .where(eq(SessionGoalTable.session_id, sessionID))
              .get()
            if (!row) return undefined
            if (!row.settlement_pending) return materialize(row, Date.now())
            const updated = yield* tx
              .update(SessionGoalTable)
              .set({
                settlement_pending: false,
              })
              .where(eq(SessionGoalTable.session_id, sessionID))
              .returning()
              .get()
            return materialize(updated, updated.time_updated)
          }),
        )
        .pipe(Effect.orDie)
    })

    return Service.of({ get, runtime, create, update, settle })
  }),
)

function materialize(row: typeof SessionGoalTable.$inferSelect, now: number): Info {
  const tokensUsed = row.tokens_used
  const timeUsedMs =
    row.time_used + (row.status === "active" && row.active_since ? Math.max(0, now - row.active_since) : 0)
  const status =
    row.status === "active" && row.token_budget !== null && tokensUsed >= row.token_budget
      ? ("budget_limited" as const)
      : row.status
  return {
    sessionID: SessionSchema.ID.make(row.session_id),
    objective: row.objective,
    status,
    tokenBudget: row.token_budget ?? undefined,
    tokensUsed,
    timeUsedMs,
    remainingTokens: row.token_budget === null ? undefined : Math.max(0, row.token_budget - tokensUsed),
    createdAt: row.time_created,
    updatedAt: status === row.status ? row.time_updated : now,
  }
}

export const node = makeGlobalNode({ service: Service, layer, deps: [Database.node] })

export * as SessionGoal from "./goal"
