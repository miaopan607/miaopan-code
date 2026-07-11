import { Question } from "@miaopan-code/schema/question"
import { Location } from "@miaopan-code/schema/location"
import { Session } from "@miaopan-code/schema/session"
import { Context, Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { QuestionNotFoundError, SessionNotFoundError } from "../errors"
import { LocationQuery, locationQueryOpenApi } from "./location"
import { t, type Language } from "../i18n"

export const makeQuestionGroup = <
  LocationId extends HttpApiMiddleware.AnyId,
  LocationService,
  SessionLocationId extends HttpApiMiddleware.AnyId,
  SessionLocationService,
>(
  locationMiddleware: Context.Key<LocationId, LocationService>,
  sessionLocationMiddleware: Context.Key<SessionLocationId, SessionLocationService>,
  language?: Language,
) => {
  const question = Question.make(language)
  return (
    HttpApiGroup.make("server.question")
      .add(
        HttpApiEndpoint.get("question.request.list", "/api/question/request", {
          query: LocationQuery,
          success: Location.response(Schema.Array(question.Request)),
        })
          .annotateMerge(locationQueryOpenApi)
          .annotateMerge(
            OpenApi.annotations({
              identifier: "v2.question.request.list",
              summary: t(language, "question_list_pending"),
              description: t(language, "question_list_pending_description"),
            }),
          ),
      )
      .annotateMerge(
        OpenApi.annotations({ title: t(language, "question_title"), description: t(language, "question_description") }),
      )
      // Effect applies group middleware only to endpoints already added; session endpoints use session placement below.
      .middleware(locationMiddleware)
      .add(
        HttpApiEndpoint.get("session.question.list", "/api/session/:sessionID/question", {
          params: { sessionID: Session.ID },
          success: Schema.Struct({ data: Schema.Array(question.Request) }),
          error: SessionNotFoundError,
        })
          .middleware(sessionLocationMiddleware)
          .annotateMerge(
            OpenApi.annotations({
              identifier: "v2.session.question.list",
              summary: t(language, "session_question_list"),
              description: t(language, "session_question_list_description"),
            }),
          ),
      )
      .add(
        HttpApiEndpoint.post("session.question.reply", "/api/session/:sessionID/question/:requestID/reply", {
          params: { sessionID: Session.ID, requestID: Question.ID },
          payload: question.Reply,
          success: HttpApiSchema.NoContent,
          error: [SessionNotFoundError, QuestionNotFoundError],
        })
          .middleware(sessionLocationMiddleware)
          .annotateMerge(
            OpenApi.annotations({
              identifier: "v2.session.question.reply",
              summary: t(language, "session_question_reply"),
              description: t(language, "session_question_reply_description"),
            }),
          ),
      )
      .add(
        HttpApiEndpoint.post("session.question.reject", "/api/session/:sessionID/question/:requestID/reject", {
          params: { sessionID: Session.ID, requestID: Question.ID },
          success: HttpApiSchema.NoContent,
          error: [SessionNotFoundError, QuestionNotFoundError],
        })
          .middleware(sessionLocationMiddleware)
          .annotateMerge(
            OpenApi.annotations({
              identifier: "v2.session.question.reject",
              summary: t(language, "session_question_reject"),
              description: t(language, "session_question_reject_description"),
            }),
          ),
      )
      .annotateMerge(
        OpenApi.annotations({
          title: t(language, "session_question_title"),
          description: t(language, "session_question_description"),
        }),
      )
  )
}
