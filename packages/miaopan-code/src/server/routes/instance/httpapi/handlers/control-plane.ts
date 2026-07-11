import { MoveSession } from "@miaopan-code/core/control-plane/move-session"
import { SessionV2 } from "@miaopan-code/core/session"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { RootHttpApi } from "../api"
import { ApiMoveSessionError, MoveSessionPayload } from "../groups/control-plane"
import { t, type Language } from "@miaopan-code/core/i18n"
import { requestLanguage } from "@miaopan-code/server/i18n"

export const controlPlaneHandlers = HttpApiBuilder.group(RootHttpApi, "controlPlane", (handlers) =>
  Effect.gen(function* () {
    const service = yield* MoveSession.Service

    const moveSession = Effect.fn("ControlPlaneHttpApi.moveSession")(function* (ctx: {
      payload: typeof MoveSessionPayload.Type
    }) {
      const language = yield* requestLanguage()
      yield* service.moveSession(ctx.payload).pipe(
        Effect.mapError(
          (error) =>
            new ApiMoveSessionError({
              name: "MoveSessionError",
              data: { message: message(error, language) },
            }),
        ),
      )
    })

    return handlers.handle("moveSession", moveSession)
  }),
)

function message(error: MoveSession.Error, language: Language) {
  if (error instanceof SessionV2.NotFoundError) return t(language, "error.session_not_found", { id: error.sessionID })
  if (error instanceof MoveSession.DestinationProjectMismatchError)
    return t(language, "error.destination_project_mismatch")
  if (error instanceof MoveSession.ApplyChangesError) return t(language, "error.destination_apply_changes")
  return error.message
}
