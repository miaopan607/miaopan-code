import { Schema } from "effect"
import { SessionMessage } from "./message"
import { SessionSchema } from "./schema"
import { zh } from "../i18n"

export class MessageDecodeError extends Schema.TaggedErrorClass<MessageDecodeError>()("Session.MessageDecodeError", {
  sessionID: SessionSchema.ID,
  messageID: SessionMessage.ID,
}) {
  override get message() {
    return zh("error.session_message_decode", { messageID: this.messageID, sessionID: this.sessionID })
  }
}

export class ContextSnapshotDecodeError extends Schema.TaggedErrorClass<ContextSnapshotDecodeError>()(
  "Session.ContextSnapshotDecodeError",
  {
    sessionID: SessionSchema.ID,
    details: Schema.String,
  },
) {
  override get message() {
    return zh("error.session_snapshot_decode", { sessionID: this.sessionID, details: this.details })
  }
}
