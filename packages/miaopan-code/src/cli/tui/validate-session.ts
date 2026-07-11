import { createMiaopanCodeClient } from "@miaopan-code/sdk/v2"
import { SessionID } from "@/session/schema"
import { Schema } from "effect"
import { UI } from "@/cli/ui"

const decodeSessionID = Schema.decodeUnknownSync(SessionID)

export async function validateSession(input: {
  url: string
  sessionID?: string
  directory?: string
  fetch?: typeof fetch
  headers?: RequestInit["headers"]
}) {
  if (!input.sessionID) return

  let sessionID: SessionID
  try {
    sessionID = decodeSessionID(input.sessionID)
  } catch (error) {
    throw new Error(
      UI.t("error.invalid_session_id_detail", {
        error: error instanceof Error ? error.message : UI.t("session.unknown_error"),
      }),
      { cause: error },
    )
  }

  await createMiaopanCodeClient({
    baseUrl: input.url,
    directory: input.directory,
    fetch: input.fetch,
    headers: input.headers,
  }).session.get({ sessionID }, { throwOnError: true })
}
