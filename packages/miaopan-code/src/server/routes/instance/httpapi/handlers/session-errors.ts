import type { NotFoundError as StorageNotFoundError } from "@/storage/storage"
import type { Session } from "@/session/session"
import { Effect } from "effect"
import * as ApiError from "../errors"
import { t } from "../i18n"
import { requestLanguage } from "@miaopan-code/server/i18n"

export function mapStorageNotFound<A, R>(self: Effect.Effect<A, StorageNotFoundError, R>) {
  return self.pipe(Effect.mapError((error) => ApiError.notFound(error.message)))
}

export function mapBusy<A, R>(self: Effect.Effect<A, Session.BusyError, R>) {
  return self.pipe(
    Effect.catchTag("SessionBusyError", (error) =>
      Effect.gen(function* () {
        const language = yield* requestLanguage()
        return yield* new ApiError.SessionBusyError({
          sessionID: error.sessionID,
          message: t(language, "error.session_busy", { id: error.sessionID }),
        })
      }),
    ),
  )
}
