import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { SessionTable } from "./sql"
import { Timestamps } from "../database/schema.sql"

export const SessionGoalTable = sqliteTable("session_goal", {
  session_id: text()
    .primaryKey()
    .references(() => SessionTable.id, { onDelete: "cascade" }),
  objective: text().notNull(),
  status: text().$type<"active" | "complete" | "blocked" | "budget_limited">().notNull(),
  token_budget: integer(),
  tokens_used: integer().notNull().default(0),
  time_used: integer().notNull().default(0),
  active_since: integer(),
  settlement_pending: integer({ mode: "boolean" }).notNull().default(false),
  ...Timestamps,
})
