import * as Tool from "./tool"
import { ToolI18n } from "./i18n"
import { ToolJsonSchema } from "./json-schema"
import { PermissionV1 } from "@miaopan-code/core/v1/permission"
import { SessionV1 } from "@miaopan-code/core/v1/session"
import { BackgroundJob } from "@/background/job"
import { Session } from "@/session/session"
import { SessionID, MessageID } from "../session/schema"
import { MessageV2 } from "../session/message-v2"
import { Agent } from "../agent/agent"
import { deriveSubagentSessionPermission } from "../agent/subagent-permissions"
import type { SessionPrompt } from "../session/prompt"
import { Config } from "@/config/config"
import { Effect, Exit, Option, Schema, Scope } from "effect"
import { EffectBridge } from "@/effect/bridge"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { Database } from "@miaopan-code/core/database/database"
import { t, type Language } from "@miaopan-code/core/i18n"
import { Permission } from "../permission"
import { Review } from "@/review"
import { Collaboration } from "../session/collaboration"
import { isDeepStrictEqual } from "node:util"

export interface TaskPromptOps {
  cancel(sessionID: SessionID): Effect.Effect<void>
  resolvePromptParts(template: string): Effect.Effect<SessionPrompt.PromptInput["parts"]>
  prompt(input: SessionPrompt.PromptInput): Effect.Effect<SessionV1.WithParts>
  continue(input: SessionPrompt.LoopInput): Effect.Effect<SessionV1.WithParts>
}

const id = "task"

function hasPermission(ruleset: PermissionV1.Ruleset, rule: PermissionV1.Rule) {
  return ruleset.some(
    (item) => item.permission === rule.permission && item.pattern === rule.pattern && item.action === rule.action,
  )
}

function uniquePermission(ruleset: PermissionV1.Ruleset) {
  return ruleset.filter(
    (rule, index) =>
      ruleset.findIndex(
        (candidate) =>
          candidate.permission === rule.permission &&
          candidate.pattern === rule.pattern &&
          candidate.action === rule.action,
      ) === index,
  )
}

const baseParameterFields = (language?: Language) => ({
  description: Schema.String.annotate({ description: t(language, "tool.param.task_description") }),
  prompt: Schema.String.annotate({ description: t(language, "tool.param.task_prompt") }),
  subagent_type: Schema.String.annotate({ description: t(language, "tool.param.task_type") }),
  task_id: Schema.optional(Schema.String).annotate({
    description: t(language, "tool.param.task_resume"),
  }),
  command: Schema.optional(Schema.String).annotate({ description: t(language, "tool.param.task_command") }),
})

const makeBaseParameters = (language?: Language) => Schema.Struct(baseParameterFields(language))

export const makeParameters = (language?: Language) =>
  Schema.Struct({
    ...baseParameterFields(language),
    background: Schema.optional(Schema.Boolean).annotate({
      description: t(language, "tool.param.task_background"),
    }),
  })
export const Parameters = makeParameters()

function renderOutput(input: {
  sessionID: SessionID
  state: "running" | "completed" | "error"
  summary?: string
  text: string
}) {
  const tag = input.state === "error" ? "task_error" : "task_result"
  return [
    `<task id="${input.sessionID}" state="${input.state}">`,
    ...(input.summary ? [`<summary>${input.summary}</summary>`] : []),
    `<${tag}>`,
    input.text,
    `</${tag}>`,
    "</task>",
  ].join("\n")
}

export const TaskTool = Tool.define(
  id,
  Effect.gen(function* () {
    const agent = yield* Agent.Service
    const background = yield* BackgroundJob.Service
    const config = yield* Config.Service
    const sessions = yield* Session.Service
    const scope = yield* Scope.Scope
    const flags = yield* RuntimeFlags.Service
    const database = yield* Database.Service
    const language = yield* ToolI18n.language()
    const latestUserOai = Effect.fnUntraced(function* (sessionID: SessionID) {
      const messages = yield* sessions.messages({ sessionID }).pipe(Effect.orDie)
      const user = messages.findLast(
        (message): message is SessionV1.WithParts & { info: SessionV1.User } => message.info.role === "user",
      )
      return user?.info.oai
    })

    const run = Effect.fn("TaskTool.execute")(function* (
      params: Schema.Schema.Type<typeof Parameters>,
      ctx: Tool.Context,
    ) {
      const cfg = yield* config.get()
      const builtinReview = Review.isBuiltinCommand(params.command, cfg)
      const runInBackground = params.background === true
      if (runInBackground && !flags.experimentalBackgroundSubagents) {
        return yield* Effect.fail(new Error(ToolI18n.text(ctx, "tool.error.background_disabled")))
      }

      if (!ctx.extra?.bypassAgentCheck) {
        yield* ctx.ask({
          permission: id,
          patterns: [params.subagent_type],
          always: ["*"],
          metadata: {
            description: params.description,
            subagent_type: params.subagent_type,
          },
        })
      }

      const next = yield* agent.get(params.subagent_type)
      if (!next) {
        return yield* Effect.fail(
          new Error(ToolI18n.text(ctx, "tool.error.unknown_agent", { type: params.subagent_type })),
        )
      }

      const session = params.task_id
        ? yield* sessions.get(SessionID.make(params.task_id)).pipe(Effect.catchCause(() => Effect.succeed(undefined)))
        : undefined
      const parent = yield* sessions.get(ctx.sessionID)
      const parentAgent = parent.agent ? yield* agent.get(parent.agent) : undefined
      const parentMode = Collaboration.resolveMode(
        parentAgent ?? { name: parent.agent ?? ctx.agent, mode: "all" },
        parent,
      )
      const childPermission = deriveSubagentSessionPermission({
        parentSessionPermission: parent.permission ?? [],
        subagent: next,
      })
      const primaryToolDenies =
        cfg.experimental?.primary_tools?.map((permission) => ({
          permission,
          pattern: "*" as const,
          action: "deny" as const,
        })) ?? []
      const childSessionPermission = [
        ...childPermission,
        ...primaryToolDenies.filter((deny) => !hasPermission(childPermission, deny)),
      ]
      const existingPermission = session?.permission ?? []
      const metadataMode = session?.metadata?.[Collaboration.MODE_METADATA_KEY]
      const legacyMode = Collaboration.mode(metadataMode) ? metadataMode : undefined
      const migratedPermission =
        session && !Collaboration.hasPermissionVersion(session.metadata)
          ? Collaboration.removeLegacyModePermission(
              existingPermission,
              legacyMode,
              (parent.permission ?? []).filter(
                (rule) => rule.permission === "external_directory" || rule.action === "deny",
              ).length,
            )
          : existingPermission
      const persistentPermission = uniquePermission(Permission.merge(migratedPermission, childSessionPermission))
      const sessionMetadata = Collaboration.markPermissionVersion(session?.metadata, parentMode)
      const nextSession =
        session ??
        (yield* sessions.create({
          parentID: ctx.sessionID,
          title: params.description + ToolI18n.text(ctx, "tool.task.subagent_suffix", { name: next.name }),
          agent: next.name,
          metadata: sessionMetadata,
          permission: persistentPermission,
        }))
      if (
        session &&
        (!isDeepStrictEqual(existingPermission, persistentPermission) ||
          !isDeepStrictEqual(session.metadata, sessionMetadata))
      ) {
        yield* sessions.setPermissionMetadata({
          sessionID: session.id,
          permission: persistentPermission,
          metadata: sessionMetadata,
        })
      }

      const msg = yield* MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID }).pipe(
        Effect.provideService(Database.Service, database),
        Effect.orDie,
      )
      if (msg.info.role !== "assistant")
        return yield* Effect.fail(new Error(ToolI18n.text(ctx, "tool.error.not_assistant")))
      const variant = msg.info.variant

      const model = next.model ?? {
        modelID: msg.info.modelID,
        providerID: msg.info.providerID,
      }
      const metadata = {
        parentSessionId: ctx.sessionID,
        sessionId: nextSession.id,
        model,
        reviewOutput: undefined as string | undefined,
        ...(runInBackground ? { background: true } : {}),
      }

      yield* ctx.metadata({
        title: params.description,
        metadata,
      })

      const ops = ctx.extra?.promptOps as TaskPromptOps
      if (!ops) return yield* Effect.fail(new Error(ToolI18n.text(ctx, "tool.error.prompt_ops")))
      const parentMessage = yield* MessageV2.get({ sessionID: ctx.sessionID, messageID: msg.info.parentID }).pipe(
        Effect.provideService(Database.Service, database),
        Effect.orDie,
      )
      const oai = parentMessage.info.role === "user" ? parentMessage.info.oai : undefined

      const runTask = Effect.fn("TaskTool.runTask")(function* () {
        if (session) {
          const lastAssistant = yield* sessions
            .findMessage(nextSession.id, (message) => message.info.role === "assistant")
            .pipe(Effect.orDie)
          const wasInterrupted =
            Option.isSome(lastAssistant) &&
            lastAssistant.value.info.role === "assistant" &&
            lastAssistant.value.info.error?.name === "MessageAbortedError"
          if (wasInterrupted) {
            const result = yield* ops.continue({
              sessionID: nextSession.id,
            })
            const text = result.parts.findLast((item) => item.type === "text")?.text ?? ""
            if (!builtinReview) return text
            return Review.renderOutput(Review.parseOutput(text), language)
          }
        }
        const parts = yield* ops.resolvePromptParts(params.prompt)
        const result = yield* ops.prompt({
          messageID: MessageID.ascending(),
          sessionID: nextSession.id,
          model: {
            modelID: model.modelID,
            providerID: model.providerID,
          },
          variant: next.model ? undefined : variant,
          agent: next.name,
          oai,
          parts,
        })
        const text = result.parts.findLast((item) => item.type === "text")?.text ?? ""
        if (!builtinReview) return text
        return Review.renderOutput(Review.parseOutput(text), language)
      })

      const inject = Effect.fn("TaskTool.injectBackgroundResult")(function* (
        state: "completed" | "error",
        text: string,
      ) {
        const currentParent = yield* sessions.get(ctx.sessionID)
        const oai = yield* latestUserOai(ctx.sessionID)
        yield* ops
          .prompt({
            sessionID: ctx.sessionID,
            agent: currentParent.agent ?? ctx.agent,
            variant,
            oai,
            parts: [
              {
                type: "text",
                synthetic: true,
                text: renderOutput({
                  sessionID: nextSession.id,
                  state,
                  summary: ToolI18n.text(
                    ctx,
                    state === "completed" ? "tool.summary.background_completed" : "tool.summary.background_failed",
                    { description: params.description },
                  ),
                  text,
                }),
              },
            ],
          })
          .pipe(Effect.ignore, Effect.forkIn(scope, { startImmediately: true }))
      })

      const notify = Effect.fn("TaskTool.notifyBackgroundResult")(function* (jobID: string) {
        yield* background.wait({ id: jobID }).pipe(
          Effect.flatMap((result) => {
            if (result.info?.status === "completed") return inject("completed", result.info.output ?? "")
            if (result.info?.status === "error") return inject("error", result.info.error ?? "")
            return Effect.void
          }),
          Effect.forkIn(scope, { startImmediately: true }),
        )
      })

      if (yield* background.extend({ id: nextSession.id, run: runTask() })) {
        return {
          title: params.description,
          metadata: {
            ...metadata,
            background: true,
            jobId: nextSession.id,
          },
          output: renderOutput({
            sessionID: nextSession.id,
            state: "running",
            summary: ToolI18n.text(ctx, "tool.summary.background_updated"),
            text: ToolI18n.text(ctx, "tool.task.background_updated"),
          }),
        }
      }

      const info = yield* background.start({
        id: nextSession.id,
        type: id,
        title: params.description,
        metadata,
        onPromote: Effect.all([
          ctx.metadata({
            title: params.description,
            metadata: { ...metadata, background: true, jobId: nextSession.id },
          }),
          notify(nextSession.id),
        ]),
        run: runTask().pipe(Effect.onInterrupt(() => ops.cancel(nextSession.id))),
      })

      function backgroundResult() {
        return {
          title: params.description,
          metadata: {
            ...metadata,
            background: true,
            jobId: info.id,
          },
          output: renderOutput({
            sessionID: nextSession.id,
            state: "running",
            summary: ToolI18n.text(ctx, "tool.summary.background_started"),
            text: ToolI18n.text(ctx, "tool.task.background_started"),
          }),
        }
      }

      if (runInBackground) {
        yield* notify(info.id)
        return backgroundResult()
      }

      const runCancel = yield* EffectBridge.make()
      const cancel = ops.cancel(nextSession.id)

      function onAbort() {
        runCancel.fork(cancel)
      }

      return yield* Effect.acquireUseRelease(
        Effect.sync(() => {
          ctx.abort.addEventListener("abort", onAbort)
        }),
        () =>
          Effect.gen(function* () {
            const result = yield* Effect.raceFirst(
              background.wait({ id: nextSession.id }).pipe(Effect.map((waited) => waited.info)),
              background.waitForPromotion(nextSession.id),
            )
            if (result?.metadata?.background === true) return backgroundResult()
            if (result?.status === "error")
              return yield* Effect.fail(new Error(result.error ?? ToolI18n.text(ctx, "tool.error.task_failed")))
            if (result?.status === "cancelled")
              return yield* Effect.fail(new Error(ToolI18n.text(ctx, "tool.error.task_cancelled")))
            return {
              title: params.description,
              metadata: {
                ...metadata,
                reviewOutput: builtinReview ? (result?.output ?? "") : undefined,
              },
              output: renderOutput({ sessionID: nextSession.id, state: "completed", text: result?.output ?? "" }),
            }
          }),
        (_, exit) =>
          Effect.gen(function* () {
            if (Exit.hasInterrupts(exit))
              yield* Effect.all([cancel, background.cancel(nextSession.id)], { discard: true })
          }).pipe(
            Effect.ensuring(
              Effect.sync(() => {
                ctx.abort.removeEventListener("abort", onAbort)
              }),
            ),
          ),
      )
    })

    return {
      description: flags.experimentalBackgroundSubagents
        ? [
            yield* ToolI18n.description("tool.task"),
            yield* ToolI18n.configuredText("tool.task.background_description"),
          ].join("\n\n")
        : yield* ToolI18n.description("tool.task"),
      parameters: makeParameters(language),
      jsonSchema: flags.experimentalBackgroundSubagents
        ? undefined
        : ToolJsonSchema.fromSchema(makeBaseParameters(language), language),
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        run(params, ctx).pipe(Effect.orDie),
    }
  }),
)
