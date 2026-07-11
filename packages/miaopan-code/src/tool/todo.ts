import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { ToolI18n } from "./i18n"
import { Todo } from "../session/todo"
import { t, type Language } from "@miaopan-code/core/i18n"

export const makeParameters = (language?: Language) =>
  Schema.Struct({
    todos: Schema.mutable(Schema.Array(Todo.Info)).annotate({ description: t(language, "tool.param.todo_list") }),
  })
export const Parameters = makeParameters()

type Metadata = {
  todos: Todo.Info[]
}

export const TodoWriteTool = Tool.define<typeof Parameters, Metadata, Todo.Service>(
  "todowrite",
  Effect.gen(function* () {
    const language = yield* ToolI18n.language()
    const todo = yield* Todo.Service

    return {
      description: yield* ToolI18n.description("tool.todowrite"),
      parameters: makeParameters(language),
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          yield* ctx.ask({
            permission: "todowrite",
            patterns: ["*"],
            always: ["*"],
            metadata: {},
          })

          yield* todo.update({
            sessionID: ctx.sessionID,
            todos: params.todos,
          })

          return {
            title: ToolI18n.text(ctx, "tool.title.todos", {
              count: params.todos.filter((x) => x.status !== "completed").length,
            }),
            output: JSON.stringify(params.todos, null, 2),
            metadata: {
              todos: params.todos,
            },
          }
        }),
    } satisfies Tool.DefWithoutID<typeof Parameters, Metadata>
  }),
)
