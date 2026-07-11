import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Question } from "../question"
import { Session } from "@/session/session"
import { ToolI18n } from "./i18n"
import { t, type Language } from "@miaopan-code/core/i18n"

const MIN_AUTO_RESOLUTION_MS = 60_000
const MAX_AUTO_RESOLUTION_MS = 240_000

const makeOption = (language?: Language) =>
  Schema.Struct({
    label: Schema.String.check(Schema.isLengthBetween(1, 80)).annotate({
      description: t(language, "request_user_input.option_label"),
    }),
    description: Schema.String.check(Schema.isMinLength(1)).annotate({
      description: t(language, "request_user_input.option_description"),
    }),
  })

const makeQuestion = (language?: Language) =>
  Schema.Struct({
    id: Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9_]*$/)).annotate({
      description: t(language, "request_user_input.id"),
    }),
    header: Schema.String.check(Schema.isLengthBetween(1, 12)).annotate({
      description: t(language, "request_user_input.header"),
    }),
    question: Schema.String.check(Schema.isMinLength(1)).annotate({
      description: t(language, "request_user_input.question"),
    }),
    options: Schema.Array(makeOption(language)).check(Schema.isLengthBetween(2, 3)).annotate({
      description: t(language, "request_user_input.options"),
    }),
  })

export const makeParameters = (language?: Language) =>
  Schema.Struct({
    questions: Schema.Array(makeQuestion(language)).check(Schema.isLengthBetween(1, 3)).annotate({
      description: t(language, "request_user_input.questions"),
    }),
    autoResolutionMs: Schema.optional(
      Schema.Int.check(
        Schema.isGreaterThanOrEqualTo(MIN_AUTO_RESOLUTION_MS),
        Schema.isLessThanOrEqualTo(MAX_AUTO_RESOLUTION_MS),
      ).annotate({ description: t(language, "request_user_input.auto_resolution") }),
    ),
  })

export const Parameters = makeParameters()

type Metadata = {
  answers: Readonly<Record<string, { answers: ReadonlyArray<string> }>>
}

class RootOnlyError extends Schema.TaggedErrorClass<RootOnlyError>()("RequestUserInput.RootOnlyError", {
  language: Schema.optional(Schema.Literals(["zh-CN", "en"])),
}) {
  override get message() {
    return t(this.language, "request_user_input.root_only")
  }
}

class DuplicateIDError extends Schema.TaggedErrorClass<DuplicateIDError>()("RequestUserInput.DuplicateIDError", {
  language: Schema.optional(Schema.Literals(["zh-CN", "en"])),
}) {
  override get message() {
    return t(this.language, "request_user_input.duplicate_id")
  }
}

export const RequestUserInputTool = Tool.define<typeof Parameters, Metadata, Question.Service | Session.Service>(
  "request_user_input",
  Effect.gen(function* () {
    const language = yield* ToolI18n.language()
    const question = yield* Question.Service
    const session = yield* Session.Service

    return {
      description: yield* ToolI18n.description("tool.request_user_input"),
      parameters: makeParameters(language),
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          if ((yield* session.get(ctx.sessionID)).parentID) {
            return yield* new RootOnlyError({ language: ctx.language })
          }
          if (new Set(params.questions.map((item) => item.id)).size !== params.questions.length) {
            return yield* new DuplicateIDError({ language: ctx.language })
          }

          const values = yield* question.ask({
            sessionID: ctx.sessionID,
            autoResolutionMs: params.autoResolutionMs,
            questions: params.questions.map((item) => ({
              question: item.question,
              header: item.header,
              options: item.options,
              multiple: false,
              custom: true,
            })),
            tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
          })
          const answers = Object.fromEntries(
            params.questions.map((item, index) => [item.id, { answers: values[index] ?? [] }]),
          )
          return {
            title: ToolI18n.text(ctx, "tool.title.questions", { count: params.questions.length }),
            output: JSON.stringify({ answers }),
            metadata: { answers },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
