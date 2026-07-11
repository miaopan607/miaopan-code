import path from "path"
import { SessionV1 } from "@miaopan-code/core/v1/session"
import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Question } from "../question"
import { Session } from "@/session/session"
import { MessageV2 } from "../session/message-v2"
import { Provider } from "@/provider/provider"
import { InstanceState } from "@/effect/instance-state"
import { MessageID, PartID } from "../session/schema"
import { ToolI18n } from "./i18n"
import { t } from "@miaopan-code/core/i18n"

export const Parameters = Schema.Struct({})

export const PlanExitTool = Tool.define(
  "plan_exit",
  Effect.gen(function* () {
    const session = yield* Session.Service
    const question = yield* Question.Service
    const provider = yield* Provider.Service

    return {
      description: yield* ToolI18n.description("tool.plan_exit"),
      parameters: Parameters,
      execute: (_params: {}, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const instance = yield* InstanceState.context
          const info = yield* session.get(ctx.sessionID)
          const plan = path.relative(instance.worktree, Session.plan(info, instance))
          const answers = yield* question.ask({
            sessionID: ctx.sessionID,
            questions: [
              {
                question: ToolI18n.text(ctx, "tool.plan_question", { plan }),
                header: ToolI18n.text(ctx, "tool.switch_build"),
                custom: false,
                options: [
                  { label: ToolI18n.text(ctx, "permission.confirm"), description: ToolI18n.text(ctx, "tool.plan_yes") },
                  { label: ToolI18n.text(ctx, "permission.cancel"), description: ToolI18n.text(ctx, "tool.plan_no") },
                ],
              },
            ],
            tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
          })

          if (answers[0]?.[0] === ToolI18n.text(ctx, "permission.cancel")) yield* new Question.RejectedError()

          const messages = yield* session.messages({ sessionID: ctx.sessionID }).pipe(Effect.orDie)
          const lastUser = messages.findLast((item) => item.info.role === "user" && item.info.model)
          const model =
            lastUser?.info.role === "user" && lastUser.info.model ? lastUser.info.model : yield* provider.defaultModel()

          const msg: SessionV1.User = {
            id: MessageID.ascending(),
            sessionID: ctx.sessionID,
            role: "user",
            time: { created: Date.now() },
            agent: "build",
            model,
          }
          yield* session.updateMessage(msg)
          yield* session.updatePart({
            id: PartID.ascending(),
            messageID: msg.id,
            sessionID: ctx.sessionID,
            type: "text",
            text: ToolI18n.text(ctx, "tool.plan_approved", { plan }),
            synthetic: true,
          } satisfies SessionV1.TextPart)

          return {
            title: ToolI18n.text(ctx, "tool.switch_build"),
            output: ToolI18n.text(ctx, "tool.build_wait"),
            metadata: {},
          }
        }).pipe(Effect.orDie),
    }
  }),
)
