export * as Question from "./question"

import { Schema } from "effect"
import { optional } from "./schema"
import { define, inventory } from "./event"
import { ascending } from "./identifier"
import { SessionID } from "./session-id"
import { statics } from "./schema"
import { t, type Language } from "./i18n"

export const ID = Schema.String.check(Schema.isStartsWith("que")).pipe(
  Schema.brand("QuestionV2.ID"),
  statics((schema) => {
    const create = () => schema.make("que_" + ascending())
    return {
      create,
      ascending: (id?: string) => (id === undefined ? create() : schema.make(id)),
    }
  }),
)
export type ID = typeof ID.Type

export function make(language?: Language) {
  const Option = Schema.Struct({
    label: Schema.String.annotate({ description: t(language, "question_label") }),
    description: Schema.String.annotate({ description: t(language, "question_description") }),
  }).annotate({ identifier: "QuestionV2.Option" })
  const base = {
    question: Schema.String.annotate({ description: t(language, "question_question") }),
    header: Schema.String.annotate({ description: t(language, "question_header") }),
    options: Schema.Array(Option).annotate({ description: t(language, "question_options") }),
    multiple: Schema.Boolean.pipe(optional).annotate({ description: t(language, "question_multiple") }),
  }
  const Info = Schema.Struct({
    ...base,
    custom: Schema.Boolean.pipe(optional).annotate({
      description: t(language, "question_custom"),
    }),
  }).annotate({ identifier: "QuestionV2.Info" })
  const Prompt = Schema.Struct(base).annotate({ identifier: "QuestionV2.Prompt" })
  const Tool = Schema.Struct({
    messageID: Schema.String,
    callID: Schema.String,
  }).annotate({ identifier: "QuestionV2.Tool" })
  const Request = Schema.Struct({
    id: ID,
    sessionID: SessionID,
    questions: Schema.Array(Info).annotate({ description: t(language, "question_questions") }),
    tool: Tool.pipe(optional),
  }).annotate({ identifier: "QuestionV2.Request" })
  const Answer = Schema.Array(Schema.String).annotate({ identifier: "QuestionV2.Answer" })
  const Reply = Schema.Struct({
    answers: Schema.Array(Answer).annotate({
      description: t(language, "question_answers"),
    }),
  }).annotate({ identifier: "QuestionV2.Reply" })
  return { Option, Info, Prompt, Tool, Request, Answer, Reply }
}

const schemas = make()
export const Option = schemas.Option
export interface Option extends Schema.Schema.Type<typeof Option> {}
export const Info = schemas.Info
export interface Info extends Schema.Schema.Type<typeof Info> {}
export const Prompt = schemas.Prompt
export interface Prompt extends Schema.Schema.Type<typeof Prompt> {}
export const Tool = schemas.Tool
export interface Tool extends Schema.Schema.Type<typeof Tool> {}
export const Request = schemas.Request
export interface Request extends Schema.Schema.Type<typeof Request> {}
export const Answer = schemas.Answer
export type Answer = typeof Answer.Type
export const Reply = schemas.Reply
export interface Reply extends Schema.Schema.Type<typeof Reply> {}

const Asked = define({ type: "question.v2.asked", schema: Request.fields })
const Replied = define({
  type: "question.v2.replied",
  schema: {
    sessionID: SessionID,
    requestID: ID,
    answers: Schema.Array(Answer),
  },
})
const Rejected = define({
  type: "question.v2.rejected",
  schema: {
    sessionID: SessionID,
    requestID: ID,
  },
})
export const Event = { Asked, Replied, Rejected, Definitions: inventory(Asked, Replied, Rejected) }
