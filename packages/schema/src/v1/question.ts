export * as QuestionV1 from "./question"

import { Schema } from "effect"
import { define, inventory } from "../event"
import { ascending } from "../identifier"
import { statics } from "../schema"
import { SessionID } from "../session-id"
import { SessionV1 } from "./session"
import { t, type Language } from "../i18n"

export const ID = Schema.String.check(Schema.isStartsWith("que")).pipe(
  Schema.brand("QuestionID"),
  statics((schema) => ({ ascending: (id?: string) => schema.make(id ?? "que_" + ascending()) })),
)

export function make(language?: Language) {
  const Option = Schema.Struct({
    label: Schema.String.annotate({ description: t(language, "question_label") }),
    description: Schema.String.annotate({ description: t(language, "question_description") }),
  }).annotate({ identifier: "QuestionOption" })
  const base = {
    question: Schema.String.annotate({ description: t(language, "question_question") }),
    header: Schema.String.annotate({ description: t(language, "question_header") }),
    options: Schema.Array(Option).annotate({ description: t(language, "question_options") }),
    multiple: Schema.optional(Schema.Boolean).annotate({ description: t(language, "question_multiple") }),
  }
  const Info = Schema.Struct({
    ...base,
    custom: Schema.optional(Schema.Boolean).annotate({ description: t(language, "question_custom") }),
  }).annotate({ identifier: "QuestionInfo" })
  const Prompt = Schema.Struct(base).annotate({ identifier: "QuestionPrompt" })
  const Tool = Schema.Struct({ messageID: SessionV1.MessageID, callID: Schema.String }).annotate({
    identifier: "QuestionTool",
  })
  const Request = Schema.Struct({
    id: ID,
    sessionID: SessionID,
    questions: Schema.Array(Info).annotate({ description: t(language, "question_questions") }),
    tool: Schema.optional(Tool),
  }).annotate({ identifier: "QuestionRequest" })
  const Answer = Schema.Array(Schema.String).annotate({ identifier: "QuestionAnswer" })
  const Reply = Schema.Struct({
    answers: Schema.Array(Answer).annotate({
      description: t(language, "question_answers"),
    }),
  }).annotate({ identifier: "QuestionReply" })
  const Replied = Schema.Struct({
    sessionID: SessionID,
    requestID: ID,
    answers: Schema.Array(Answer),
  }).annotate({
    identifier: "QuestionReplied",
  })
  const Rejected = Schema.Struct({ sessionID: SessionID, requestID: ID }).annotate({
    identifier: "QuestionRejected",
  })
  return { Option, Info, Prompt, Tool, Request, Answer, Reply, Replied, Rejected }
}

const schemas = make()
export const Option = schemas.Option
export const Info = schemas.Info
export const Prompt = schemas.Prompt
export const Tool = schemas.Tool
export const Request = schemas.Request
export const Answer = schemas.Answer
export const Reply = schemas.Reply
export const Replied = schemas.Replied
export const Rejected = schemas.Rejected

const Asked = define({ type: "question.asked", schema: Request.fields })
const RepliedEvent = define({ type: "question.replied", schema: Replied.fields })
const RejectedEvent = define({ type: "question.rejected", schema: Rejected.fields })
export const Event = {
  Asked,
  Replied: RepliedEvent,
  Rejected: RejectedEvent,
  Definitions: inventory(Asked, RepliedEvent, RejectedEvent),
}
