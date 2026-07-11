import { QuestionV2 } from "@miaopan-code/core/question"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiSchema } from "effect/unstable/httpapi"
import { Api } from "../api"
import { QuestionNotFoundError } from "@miaopan-code/protocol/errors"
import { response } from "../location"
import { t, type Language } from "@miaopan-code/core/i18n"
import { requestLanguage } from "../i18n"

function missingRequest(id: QuestionV2.ID, language: Language) {
  return new QuestionNotFoundError({ requestID: id, message: t(language, "error.question_not_found", { id }) })
}

export const QuestionHandler = HttpApiBuilder.group(Api, "server.question", (handlers) =>
  Effect.gen(function* () {
    const withOwnedQuestion = Effect.fnUntraced(function* <A, E>(
      sessionID: QuestionV2.Request["sessionID"],
      requestID: QuestionV2.ID,
      use: (question: QuestionV2.Interface, language: Language) => Effect.Effect<A, E>,
    ) {
      const language = yield* requestLanguage()
      const question = yield* QuestionV2.Service
      const request = (yield* question.list()).find((request) => request.id === requestID)
      if (!request || request.sessionID !== sessionID) return yield* missingRequest(requestID, language)
      return yield* use(question, language)
    })

    return handlers
      .handle(
        "question.request.list",
        Effect.fn(function* () {
          return yield* response((yield* QuestionV2.Service).list())
        }),
      )
      .handle(
        "session.question.list",
        Effect.fn(function* (ctx) {
          const requests = yield* (yield* QuestionV2.Service).list()
          return { data: requests.filter((request) => request.sessionID === ctx.params.sessionID) }
        }),
      )
      .handle(
        "session.question.reply",
        Effect.fn(function* (ctx) {
          yield* withOwnedQuestion(ctx.params.sessionID, ctx.params.requestID, (question, language) =>
            question
              .reply({ requestID: ctx.params.requestID, answers: ctx.payload.answers })
              .pipe(Effect.catchTag("QuestionV2.NotFoundError", () => missingRequest(ctx.params.requestID, language))),
          )
          return HttpApiSchema.NoContent.make()
        }),
      )
      .handle(
        "session.question.reject",
        Effect.fn(function* (ctx) {
          yield* withOwnedQuestion(ctx.params.sessionID, ctx.params.requestID, (question, language) =>
            question
              .reject(ctx.params.requestID)
              .pipe(Effect.catchTag("QuestionV2.NotFoundError", () => missingRequest(ctx.params.requestID, language))),
          )
          return HttpApiSchema.NoContent.make()
        }),
      )
  }),
)
