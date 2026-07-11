import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Question } from "../question"
import { ToolI18n } from "./i18n"
import { t, type Language } from "@miaopan-code/core/i18n"

export const makeParameters = (language?: Language) =>
  Schema.Struct({
    questions: Schema.mutable(Schema.Array(Question.Prompt)).annotate({
      description: t(language, "question.questions"),
    }),
  })
export const Parameters = makeParameters()

type Metadata = {
  answers: ReadonlyArray<Question.Answer>
}

export const QuestionTool = Tool.define<typeof Parameters, Metadata, Question.Service>(
  "question",
  Effect.gen(function* () {
    const language = yield* ToolI18n.language()
    const question = yield* Question.Service

    return {
      description: yield* ToolI18n.description("tool.question"),
      parameters: makeParameters(language),
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          const answers = yield* question.ask({
            sessionID: ctx.sessionID,
            questions: params.questions,
            tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
          })

          const formatted = params.questions
            .map(
              (q, i) =>
                `"${q.question}"="${answers[i]?.length ? answers[i].join(", ") : ToolI18n.text(ctx, "tool.question.unanswered")}"`,
            )
            .join(", ")

          return {
            title: ToolI18n.text(ctx, "tool.title.questions", { count: params.questions.length }),
            output: ToolI18n.text(ctx, "tool.question.answered", { formatted }),
            metadata: {
              answers,
            },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
