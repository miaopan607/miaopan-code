import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { t } from "@miaopan-code/core/i18n"
import { Deferred, Effect, Layer, Schema, Context } from "effect"
import { InstanceState } from "@/effect/instance-state"
import { SessionID } from "@/session/schema"
import { QuestionID } from "./schema"
import { EventV2Bridge } from "@/event-v2-bridge"
import { QuestionV1 } from "@miaopan-code/schema/question-v1"
import { Config } from "@/config/config"

export const Option = QuestionV1.Option
export type Option = typeof Option.Type
export const Info = QuestionV1.Info
export type Info = typeof Info.Type
export const Prompt = QuestionV1.Prompt
export type Prompt = typeof Prompt.Type
export const Tool = QuestionV1.Tool
export type Tool = typeof Tool.Type
export const Request = QuestionV1.Request
export type Request = typeof Request.Type
export const Answer = QuestionV1.Answer
export type Answer = typeof Answer.Type
export const Reply = QuestionV1.Reply
export type Reply = typeof Reply.Type
export const Replied = QuestionV1.Replied
export const Rejected = QuestionV1.Rejected
export const Event = QuestionV1.Event

export class RejectedError extends Schema.TaggedErrorClass<RejectedError>()("QuestionRejectedError", {
  language: Schema.optional(Schema.Literals(["zh-CN", "en"])),
}) {
  override get message() {
    return t(this.language, "question.user_dismissed")
  }
}

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()("Question.NotFoundError", {
  requestID: QuestionID,
}) {}

interface PendingEntry {
  info: Request
  deferred: Deferred.Deferred<ReadonlyArray<Answer>, RejectedError>
  language: "zh-CN" | "en"
}

interface State {
  pending: Map<QuestionID, PendingEntry>
}

// Service

export interface Interface {
  readonly ask: (input: {
    sessionID: SessionID
    questions: ReadonlyArray<Info>
    autoResolutionMs?: number
    tool?: Tool
  }) => Effect.Effect<ReadonlyArray<Answer>, RejectedError>
  readonly reply: (input: {
    requestID: QuestionID
    answers: ReadonlyArray<Answer>
  }) => Effect.Effect<void, NotFoundError>
  readonly reject: (requestID: QuestionID) => Effect.Effect<void, NotFoundError>
  readonly list: () => Effect.Effect<ReadonlyArray<Request>>
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/Question") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const events = yield* EventV2Bridge.Service
    const config = yield* Config.Service
    const state = yield* InstanceState.make<State>(
      Effect.fn("Question.state")(function* () {
        const state = {
          pending: new Map<QuestionID, PendingEntry>(),
        }

        yield* Effect.addFinalizer(() =>
          Effect.gen(function* () {
            for (const item of state.pending.values()) {
              yield* Deferred.fail(item.deferred, new RejectedError({ language: item.language }))
            }
            state.pending.clear()
          }),
        )

        return state
      }),
    )

    const ask = Effect.fn("Question.ask")(function* (input: {
      sessionID: SessionID
      questions: ReadonlyArray<Info>
      autoResolutionMs?: number
      tool?: Tool
    }) {
      const pending = (yield* InstanceState.get(state)).pending
      const cfg = yield* config.get()
      const language = cfg.language === "en" ? "en" : "zh-CN"
      const autoResolutionMs = cfg.question?.auto_resolution === false ? undefined : input.autoResolutionMs
      const id = QuestionID.ascending()
      yield* Effect.logInfo(t(language, "log.question_asking"), { id, questions: input.questions.length })

      const deferred = yield* Deferred.make<ReadonlyArray<Answer>, RejectedError>()
      const info: Request = {
        id,
        sessionID: input.sessionID,
        questions: input.questions,
        tool: input.tool,
      }
      pending.set(id, { info, deferred, language })
      yield* events.publish(Event.Asked, info)

      return yield* Effect.ensuring(
        autoResolutionMs === undefined
          ? Deferred.await(deferred)
          : Effect.raceFirst(
              Deferred.await(deferred),
              Effect.sleep(autoResolutionMs).pipe(
                Effect.andThen(
                  Effect.gen(function* () {
                    const answers = input.questions.map(() => [] as string[])
                    yield* events.publish(Event.Replied, {
                      sessionID: input.sessionID,
                      requestID: id,
                      answers,
                    })
                    return answers
                  }),
                ),
              ),
            ),
        Effect.sync(() => {
          pending.delete(id)
        }),
      )
    })

    const reply = Effect.fn("Question.reply")(function* (input: {
      requestID: QuestionID
      answers: ReadonlyArray<Answer>
    }) {
      const pending = (yield* InstanceState.get(state)).pending
      const language = (yield* config.get()).language
      const existing = pending.get(input.requestID)
      if (!existing) {
        yield* Effect.logWarning(t(language, "log.question_unknown_reply"), { requestID: input.requestID })
        return yield* new NotFoundError({ requestID: input.requestID })
      }
      pending.delete(input.requestID)
      yield* Effect.logInfo(t(language, "log.question_replied"), {
        requestID: input.requestID,
        answers: input.answers,
      })
      yield* events.publish(Event.Replied, {
        sessionID: existing.info.sessionID,
        requestID: existing.info.id,
        answers: input.answers.map((a) => [...a]),
      })
      yield* Deferred.succeed(existing.deferred, input.answers)
    })

    const reject = Effect.fn("Question.reject")(function* (requestID: QuestionID) {
      const pending = (yield* InstanceState.get(state)).pending
      const language = (yield* config.get()).language
      const existing = pending.get(requestID)
      if (!existing) {
        yield* Effect.logWarning(t(language, "log.question_unknown_reject"), { requestID })
        return yield* new NotFoundError({ requestID })
      }
      pending.delete(requestID)
      yield* Effect.logInfo(t(language, "log.question_rejected"), { requestID })
      yield* events.publish(Event.Rejected, {
        sessionID: existing.info.sessionID,
        requestID: existing.info.id,
      })
      yield* Deferred.fail(existing.deferred, new RejectedError({ language: existing.language }))
    })

    const list = Effect.fn("Question.list")(function* () {
      const pending = (yield* InstanceState.get(state)).pending
      return Array.from(pending.values(), (x) => x.info)
    })

    return Service.of({ ask, reply, reject, list })
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [EventV2Bridge.node, Config.node] })

export * as Question from "."
