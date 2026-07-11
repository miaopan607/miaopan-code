import { SessionMessage } from "@miaopan-code/schema/session-message"
import { SessionInput } from "@miaopan-code/schema/session-input"
import { PromptInput } from "@miaopan-code/schema/prompt-input"
import { Session } from "@miaopan-code/schema/session"
import { Project } from "@miaopan-code/schema/project"
import { AbsolutePath, NonNegativeInt, PositiveInt, RelativePath, statics } from "@miaopan-code/schema/schema"
import { Workspace } from "@miaopan-code/schema/workspace"
import { Context, Effect, Encoding, Result, Schema, Struct } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import {
  ConflictError,
  InvalidCursorError,
  InvalidRequestError,
  MessageNotFoundError,
  ServiceUnavailableError,
  SessionNotFoundError,
  UnknownError,
} from "../errors"
import { Agent } from "@miaopan-code/schema/agent"
import { Model } from "@miaopan-code/schema/model"
import { Location } from "@miaopan-code/schema/location"
import { Revert } from "@miaopan-code/schema/revert"
import { SessionEvent } from "@miaopan-code/schema/session-event"
import { t, type Language } from "../i18n"

const makeSessionSchemas = (language?: Language) => {
  const queryFields = {
    workspace: Workspace.ID.pipe(Schema.optional),
    limit: Schema.NumberFromString.pipe(Schema.decodeTo(PositiveInt), Schema.optional).annotate({
      description: t(language, "session_limit_description"),
    }),
    order: Schema.optional(Schema.Union([Schema.Literal("asc"), Schema.Literal("desc")])).annotate({
      description: t(language, "session_order_description"),
    }),
    search: Schema.optional(Schema.String),
  }

  const directoryQuery = Schema.Struct({
    ...queryFields,
    directory: AbsolutePath,
  })
  const projectQuery = Schema.Struct({
    ...queryFields,
    project: Project.ID,
    subpath: RelativePath.pipe(Schema.optional),
  })
  const allQuery = Schema.Struct(queryFields)
  const withCursor = <Fields extends Schema.Struct.Fields>(schema: Schema.Struct<Fields>) =>
    schema.mapFields((fields) => ({
      ...Struct.omit(fields, ["limit"]),
      anchor: Session.ListAnchor,
    }))
  const cursorInput = Schema.Union([withCursor(directoryQuery), withCursor(projectQuery), withCursor(allQuery)])
  const cursorJson = Schema.fromJsonString(cursorInput)
  const encodeCursor = Schema.encodeSync(cursorJson)
  const decodeCursor = Schema.decodeUnknownEffect(cursorJson)
  const invalidCursor = t(language, "invalid_cursor")
  const cursor = Schema.String.pipe(
    Schema.brand("SessionsCursor"),
    statics((schema) => {
      const make = schema.make.bind(schema)
      return {
        make: (input: typeof cursorInput.Type) => make(Encoding.encodeBase64Url(encodeCursor(input))),
        parse: (input: string) =>
          Effect.suspend(() => {
            const result = Encoding.decodeBase64UrlString(input)
            return Result.isFailure(result)
              ? Effect.fail(invalidCursor)
              : decodeCursor(result.success).pipe(Effect.mapError(() => invalidCursor))
          }),
      }
    }),
  )
  const query = Schema.Struct({
    ...queryFields,
    directory: AbsolutePath.pipe(Schema.optional),
    project: Project.ID.pipe(Schema.optional),
    subpath: RelativePath.pipe(Schema.optional),
    cursor: cursor.annotate({ description: t(language, "session_cursor_description") }).pipe(Schema.optional),
  }).annotate({ identifier: "SessionsQuery" })
  return { cursor, query }
}

export const makeSessionsCursor = (language?: Language) => makeSessionSchemas(language).cursor
export const makeSessionsQuery = (language?: Language) => makeSessionSchemas(language).query
export const SessionsCursor = makeSessionsCursor()
export type SessionsCursor = typeof SessionsCursor.Type
export const SessionsQuery = makeSessionsQuery()

const SessionActive = Schema.Struct({
  type: Schema.Literal("running"),
}).annotate({ identifier: "SessionActive" })

const SessionHistoryLimit = PositiveInt.check(Schema.isLessThanOrEqualTo(100))

export const SessionHistoryQuery = Schema.Struct({
  limit: Schema.NumberFromString.pipe(Schema.decodeTo(SessionHistoryLimit), Schema.optional),
  after: Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt), Schema.optional),
})

export const makeSessionGroup = <I extends HttpApiMiddleware.AnyId, S>(
  sessionLocationMiddleware: Context.Key<I, S>,
  language?: Language,
) => {
  const sessionSchemas = makeSessionSchemas(language)
  return HttpApiGroup.make("server.session")
    .add(
      HttpApiEndpoint.get("session.list", "/api/session", {
        query: sessionSchemas.query,
        success: Schema.Struct({
          data: Schema.Array(Session.Info),
          cursor: Schema.Struct({
            previous: sessionSchemas.cursor.pipe(Schema.optional),
            next: sessionSchemas.cursor.pipe(Schema.optional),
          }),
        }).annotate({ identifier: "SessionsResponse" }),
        error: [InvalidCursorError, InvalidRequestError],
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "v2.session.list",
          summary: t(language, "session_list"),
          description: t(language, "session_list_description"),
        }),
      ),
    )
    .add(
      HttpApiEndpoint.post("session.create", "/api/session", {
        payload: Schema.Struct({
          id: Session.ID.pipe(Schema.optional),
          agent: Agent.ID.pipe(Schema.optional),
          model: Model.Ref.pipe(Schema.optional),
          location: Location.Ref.pipe(Schema.optional),
        }),
        success: Schema.Struct({ data: Session.Info }),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "v2.session.create",
          summary: t(language, "session_create"),
          description: t(language, "session_create_description"),
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("session.active", "/api/session/active", {
        success: Schema.Struct({ data: Schema.Record(Session.ID, SessionActive) }),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "v2.session.active",
          summary: t(language, "session_active"),
          description: t(language, "session_active_description"),
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("session.get", "/api/session/:sessionID", {
        params: { sessionID: Session.ID },
        success: Schema.Struct({ data: Session.Info }),
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.get",
            summary: t(language, "session_get"),
            description: t(language, "session_get_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.switchAgent", "/api/session/:sessionID/agent", {
        params: { sessionID: Session.ID },
        payload: Schema.Struct({ agent: Agent.ID }),
        success: HttpApiSchema.NoContent,
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.switchAgent",
            summary: t(language, "session_switch_agent"),
            description: t(language, "session_switch_agent_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.switchModel", "/api/session/:sessionID/model", {
        params: { sessionID: Session.ID },
        payload: Schema.Struct({ model: Model.Ref }),
        success: HttpApiSchema.NoContent,
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.switchModel",
            summary: t(language, "session_switch_model"),
            description: t(language, "session_switch_model_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.prompt", "/api/session/:sessionID/prompt", {
        params: { sessionID: Session.ID },
        payload: Schema.Struct({
          id: SessionMessage.ID.pipe(Schema.optional),
          prompt: PromptInput.Prompt,
          delivery: SessionInput.Delivery.pipe(Schema.optional),
          resume: Schema.Boolean.pipe(Schema.optional),
        }),
        success: Schema.Struct({ data: SessionInput.Admitted }),
        error: [ConflictError, SessionNotFoundError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.prompt",
            summary: t(language, "session_send_message"),
            description: t(language, "session_send_message_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.compact", "/api/session/:sessionID/compact", {
        params: { sessionID: Session.ID },
        success: HttpApiSchema.NoContent,
        error: [SessionNotFoundError, ServiceUnavailableError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.compact",
            summary: t(language, "session_compact"),
            description: t(language, "session_compact_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.wait", "/api/session/:sessionID/wait", {
        params: { sessionID: Session.ID },
        success: HttpApiSchema.NoContent,
        error: [SessionNotFoundError, ServiceUnavailableError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.wait",
            summary: t(language, "session_wait"),
            description: t(language, "session_wait_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.revert.stage", "/api/session/:sessionID/revert/stage", {
        params: { sessionID: Session.ID },
        payload: Schema.Struct({ messageID: SessionMessage.ID, files: Schema.Boolean.pipe(Schema.optional) }),
        success: Schema.Struct({ data: Revert.State }),
        error: [MessageNotFoundError, SessionNotFoundError, UnknownError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.revert.stage",
            summary: t(language, "session_revert_stage"),
            description: t(language, "session_revert_stage_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.revert.clear", "/api/session/:sessionID/revert/clear", {
        params: { sessionID: Session.ID },
        success: HttpApiSchema.NoContent,
        error: [SessionNotFoundError, UnknownError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({ identifier: "v2.session.revert.clear", summary: t(language, "session_revert_clear") }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.revert.commit", "/api/session/:sessionID/revert/commit", {
        params: { sessionID: Session.ID },
        success: HttpApiSchema.NoContent,
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.revert.commit",
            summary: t(language, "session_revert_commit"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("session.context", "/api/session/:sessionID/context", {
        params: { sessionID: Session.ID },
        success: Schema.Struct({ data: Schema.Array(SessionMessage.Message) }),
        error: [SessionNotFoundError, UnknownError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.context",
            summary: t(language, "session_context"),
            description: t(language, "session_context_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("session.history", "/api/session/:sessionID/history", {
        params: { sessionID: Session.ID },
        query: SessionHistoryQuery,
        success: Schema.Struct({
          data: Schema.Array(SessionEvent.Durable),
          hasMore: Schema.Boolean,
        }).annotate({ identifier: "SessionHistory" }),
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.history",
            summary: t(language, "session_history"),
            description: t(language, "session_history_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("session.events", "/api/session/:sessionID/event", {
        params: { sessionID: Session.ID },
        query: {
          after: Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt), Schema.optional),
        },
        success: HttpApiSchema.StreamSse({ data: SessionEvent.Durable }),
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.events",
            summary: t(language, "session_events"),
            description: t(language, "session_events_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("session.interrupt", "/api/session/:sessionID/interrupt", {
        params: { sessionID: Session.ID },
        success: HttpApiSchema.NoContent,
        error: SessionNotFoundError,
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.interrupt",
            summary: t(language, "session_interrupt"),
            description: t(language, "session_interrupt_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("session.message", "/api/session/:sessionID/message/:messageID", {
        params: { sessionID: Session.ID, messageID: SessionMessage.ID },
        success: Schema.Struct({ data: SessionMessage.Message }),
        error: [SessionNotFoundError, MessageNotFoundError],
      })
        .middleware(sessionLocationMiddleware)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.session.message",
            summary: t(language, "session_message"),
            description: t(language, "session_message_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "session_title"),
        description: t(language, "session_description"),
      }),
    )
}
