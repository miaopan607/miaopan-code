import { Location } from "@miaopan-code/core/location"
import { PermissionV2 } from "@miaopan-code/core/permission"
import { PermissionSaved } from "@miaopan-code/core/permission/saved"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiSchema } from "effect/unstable/httpapi"
import { Api } from "../api"
import { PermissionNotFoundError, SessionNotFoundError } from "@miaopan-code/protocol/errors"
import { response } from "../location"
import { t, type Language } from "@miaopan-code/core/i18n"
import { requestLanguage } from "../i18n"

function missingRequest(id: PermissionV2.ID, language: Language) {
  return new PermissionNotFoundError({ requestID: id, message: t(language, "error.permission_not_found", { id }) })
}

export const PermissionHandler = HttpApiBuilder.group(Api, "server.permission", (handlers) =>
  Effect.gen(function* () {
    return handlers
      .handle(
        "permission.request.list",
        Effect.fn(function* () {
          return yield* response((yield* PermissionV2.Service).list())
        }),
      )
      .handle(
        "session.permission.create",
        Effect.fn(function* (ctx) {
          const permission = yield* PermissionV2.Service
          const language = yield* requestLanguage()
          return {
            data: yield* permission
              .ask({
                id: ctx.payload.id,
                sessionID: ctx.params.sessionID,
                action: ctx.payload.action,
                resources: ctx.payload.resources,
                save: ctx.payload.save,
                metadata: ctx.payload.metadata,
                source: ctx.payload.source,
                agent: ctx.payload.agent,
              })
              .pipe(
                Effect.catchTag(
                  "Session.NotFoundError",
                  (error) =>
                    new SessionNotFoundError({
                      sessionID: error.sessionID,
                      message: t(language, "error.session_not_found", { id: error.sessionID }),
                    }),
                ),
              ),
          }
        }),
      )
      .handle(
        "session.permission.list",
        Effect.fn(function* (ctx) {
          const permission = yield* PermissionV2.Service
          return { data: yield* permission.forSession(ctx.params.sessionID) }
        }),
      )
      .handle(
        "session.permission.get",
        Effect.fn(function* (ctx) {
          const language = yield* requestLanguage()
          const request = yield* (yield* PermissionV2.Service).get(ctx.params.requestID)
          if (!request || request.sessionID !== ctx.params.sessionID)
            return yield* missingRequest(ctx.params.requestID, language)
          return { data: request }
        }),
      )
      .handle(
        "session.permission.reply",
        Effect.fn(function* (ctx) {
          const permission = yield* PermissionV2.Service
          const language = yield* requestLanguage()
          const request = yield* permission.get(ctx.params.requestID)
          if (!request || request.sessionID !== ctx.params.sessionID)
            return yield* missingRequest(ctx.params.requestID, language)
          yield* permission
            .reply({ requestID: ctx.params.requestID, reply: ctx.payload.reply, message: ctx.payload.message })
            .pipe(Effect.catchTag("PermissionV2.NotFoundError", () => missingRequest(ctx.params.requestID, language)))
          return HttpApiSchema.NoContent.make()
        }),
      )
      .handle(
        "permission.saved.list",
        Effect.fn(function* (ctx) {
          const location = yield* Location.Service
          return {
            data: yield* (yield* PermissionSaved.Service).list({
              projectID: ctx.query.projectID ?? location.project.id,
            }),
          }
        }),
      )
      .handle(
        "permission.saved.remove",
        Effect.fn(function* (ctx) {
          yield* (yield* PermissionSaved.Service).remove(ctx.params.id)
          return HttpApiSchema.NoContent.make()
        }),
      )
  }),
)
