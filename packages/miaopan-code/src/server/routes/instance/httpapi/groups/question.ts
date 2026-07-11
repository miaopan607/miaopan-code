import { Question } from "@/question"
import { QuestionID } from "@/question/schema"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { QuestionNotFoundError } from "../errors"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "@miaopan-code/protocol/i18n"

const root = "/question"
const makeReplyPayload = (language?: Language) =>
  Schema.Struct({
    answers: Schema.Array(Question.Answer).annotate({
      description: t(language, "session_question_reply_description"),
    }),
  })

const ReplyPayload = makeReplyPayload()

export const makeQuestionApi = (language?: Language) =>
  HttpApi.make("question")
    .add(
      HttpApiGroup.make("question")
        .add(
          HttpApiEndpoint.get("list", root, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Question.Request), t(language, "question_list_pending")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "question.list",
              summary: t(language, "question_list_pending"),
              description: t(language, "question_list_pending_description"),
            }),
          ),
          HttpApiEndpoint.post("reply", `${root}/:requestID/reply`, {
            params: { requestID: QuestionID },
            query: WorkspaceRoutingQuery,
            payload: makeReplyPayload(language),
            success: described(Schema.Boolean, t(language, "session_question_reply")),
            error: [HttpApiError.BadRequest, QuestionNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "question.reply",
              summary: t(language, "session_question_reply"),
              description: t(language, "session_question_reply_description"),
            }),
          ),
          HttpApiEndpoint.post("reject", `${root}/:requestID/reject`, {
            params: { requestID: QuestionID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "session_question_reject")),
            error: [HttpApiError.BadRequest, QuestionNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "question.reject",
              summary: t(language, "session_question_reject"),
              description: t(language, "session_question_reject_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: t(language, "question_title"),
            description: t(language, "question_description"),
          }),
        )
        .middleware(InstanceContextMiddleware)
        .middleware(WorkspaceRoutingMiddleware)
        .middleware(Authorization),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "api_title"),
        version: "0.0.1",
        description: t(language, "api_description"),
      }),
    )

export const QuestionApi = makeQuestionApi()
