import { Session } from "@miaopan-code/schema/session"
import { SessionMessage } from "@miaopan-code/schema/session-message"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { InvalidCursorError, SessionNotFoundError, UnknownError } from "../errors"
import { t, type Language } from "../i18n"

export const makeSessionMessagesQuery = (language?: Language) =>
  Schema.Struct({
    limit: Schema.optional(
      Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(200)),
    ).annotate({
      description: t(language, "message_limit_description"),
    }),
    order: Schema.optional(Schema.Union([Schema.Literal("asc"), Schema.Literal("desc")])).annotate({
      description: t(language, "message_order_description"),
    }),
    cursor: Schema.optional(
      Schema.String.annotate({
        description: t(language, "message_cursor_description"),
      }),
    ),
  }).annotate({ identifier: "SessionMessagesQuery" })

export const makeMessageGroup = (language?: Language) =>
  HttpApiGroup.make("server.message")
    .add(
      HttpApiEndpoint.get("session.messages", "/api/session/:sessionID/message", {
        params: { sessionID: Session.ID },
        query: makeSessionMessagesQuery(language),
        success: Schema.Struct({
          data: Schema.Array(SessionMessage.Message),
          cursor: Schema.Struct({
            previous: Schema.String.pipe(Schema.optional),
            next: Schema.String.pipe(Schema.optional),
          }),
        }).annotate({ identifier: "SessionMessagesResponse" }),
        error: [InvalidCursorError, SessionNotFoundError, UnknownError],
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "v2.session.messages",
          summary: t(language, "message_get"),
          description: t(language, "message_get_description_full"),
        }),
      ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "message_title"),
        description: t(language, "message_description"),
      }),
    )

export const SessionMessagesQuery = makeSessionMessagesQuery()
export const MessageGroup = makeMessageGroup()
