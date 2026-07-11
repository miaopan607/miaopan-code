import { Effect } from "effect"
import type { DatabaseMigration } from "../migration"

export default {
  id: "20260711102356_session-goal",
  up(tx) {
    return Effect.gen(function* () {
      yield* tx.run(`
        CREATE TABLE \`session_goal\` (
          \`session_id\` text PRIMARY KEY,
          \`objective\` text NOT NULL,
          \`status\` text NOT NULL,
          \`token_budget\` integer,
          \`tokens_used\` integer DEFAULT 0 NOT NULL,
          \`time_used\` integer DEFAULT 0 NOT NULL,
          \`active_since\` integer,
          \`settlement_pending\` integer DEFAULT false NOT NULL,
          \`time_created\` integer NOT NULL,
          \`time_updated\` integer NOT NULL,
          CONSTRAINT \`fk_session_goal_session_id_session_id_fk\` FOREIGN KEY (\`session_id\`) REFERENCES \`session\`(\`id\`) ON DELETE CASCADE
        );
      `)
    })
  },
} satisfies DatabaseMigration.Migration
