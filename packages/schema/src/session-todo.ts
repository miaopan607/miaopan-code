export * as SessionTodo from "./session-todo"

import { Schema } from "effect"
import { define, inventory } from "./event"
import { SessionID } from "./session-id"
import { t, type Language } from "./i18n"

export const make = (language?: Language) =>
  Schema.Struct({
    content: Schema.String.annotate({ description: t(language, "todo_content") }),
    status: Schema.String.annotate({
      description: t(language, "todo_status"),
    }),
    priority: Schema.String.annotate({
      description: t(language, "todo_priority"),
    }),
  }).annotate({ identifier: "Todo" })

export const Info = make()
export interface Info extends Schema.Schema.Type<typeof Info> {}

const Updated = define({
  type: "todo.updated",
  schema: {
    sessionID: SessionID,
    todos: Schema.Array(Info),
  },
})
export const Event = { Updated, Definitions: inventory(Updated) }
