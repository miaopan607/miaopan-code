import { PermissionV1 } from "@miaopan-code/core/v1/permission"
import { Permission } from "@/permission"
import { SessionV1 } from "@miaopan-code/core/v1/session"

import { Session } from "@/session/session"
import { MessageV2 } from "@/session/message-v2"
import { SessionPrompt } from "@/session/prompt"
import { SessionRevert } from "@/session/revert"
import { SessionStatus } from "@/session/status"
import { SessionSummary } from "@/session/summary"
import { Todo } from "@/session/todo"
import { MessageID, PartID, SessionID } from "@/session/schema"
import { Snapshot } from "@/snapshot"
import { Schema, Struct } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import {
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingQuery,
  WorkspaceRoutingQueryFields,
} from "../middleware/workspace-routing"
import { ApiNotFoundError, PermissionNotFoundError, SessionBusyError } from "../errors"
import { described } from "./metadata"
import { QueryBoolean } from "./query"
import { t, type Language } from "@miaopan-code/protocol/i18n"
import { text } from "../i18n"
import { ProviderV2 } from "@miaopan-code/core/provider"
import { ModelV2 } from "@miaopan-code/core/model"

const root = "/session"
export const ListQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  scope: Schema.optional(Schema.Literals(["project"])),
  path: Schema.optional(Schema.String),
  roots: Schema.optional(QueryBoolean),
  start: Schema.optional(Schema.NumberFromString),
  search: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.NumberFromString),
})
export const DiffQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  ...Struct.omit(SessionSummary.DiffInput.fields, ["sessionID"]),
})
export const MessagesQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  limit: Schema.optional(Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))),
  before: Schema.optional(Schema.String),
})
export const StatusMap = Schema.Record(Schema.String, SessionStatus.Info)
export const UpdatePayload = Schema.Struct({
  title: Schema.optional(Schema.String),
  metadata: Schema.optional(Session.Metadata),
  permission: Schema.optional(PermissionV1.Ruleset),
  time: Schema.optional(
    Schema.Struct({
      archived: Schema.optional(Session.ArchivedTimestamp),
    }),
  ),
})
export const ForkPayload = Schema.Struct(Struct.omit(Session.ForkInput.fields, ["sessionID"]))
export const InitPayload = Schema.Struct({
  modelID: ModelV2.ID,
  providerID: ProviderV2.ID,
  messageID: MessageID,
})
export const SummarizePayload = Schema.Struct({
  providerID: ProviderV2.ID,
  modelID: ModelV2.ID,
  auto: Schema.optional(Schema.Boolean),
})
export const PromptPayload = Schema.Struct(Struct.omit(SessionPrompt.PromptInput.fields, ["sessionID"]))
export const ContinuePayload = Schema.Struct(Struct.omit(SessionPrompt.ContinueInput.fields, ["sessionID"]))
export const CommandPayload = Schema.Struct(Struct.omit(SessionPrompt.CommandInput.fields, ["sessionID"]))
export const ShellPayload = Schema.Struct(Struct.omit(SessionPrompt.ShellInput.fields, ["sessionID"]))
export const RevertPayload = Schema.Struct(Struct.omit(SessionRevert.RevertInput.fields, ["sessionID"]))
export const PermissionResponsePayload = Schema.Struct({
  response: PermissionV1.Reply,
})

export const SessionPaths = {
  list: root,
  status: `${root}/status`,
  get: `${root}/:sessionID`,
  children: `${root}/:sessionID/children`,
  todo: `${root}/:sessionID/todo`,
  diff: `${root}/:sessionID/diff`,
  messages: `${root}/:sessionID/message`,
  message: `${root}/:sessionID/message/:messageID`,
  create: root,
  remove: `${root}/:sessionID`,
  update: `${root}/:sessionID`,
  fork: `${root}/:sessionID/fork`,
  abort: `${root}/:sessionID/abort`,
  share: `${root}/:sessionID/share`,
  init: `${root}/:sessionID/init`,
  summarize: `${root}/:sessionID/summarize`,
  prompt: `${root}/:sessionID/message`,
  promptAsync: `${root}/:sessionID/prompt_async`,
  continue: `${root}/:sessionID/continue`,
  command: `${root}/:sessionID/command`,
  shell: `${root}/:sessionID/shell`,
  revert: `${root}/:sessionID/revert`,
  unrevert: `${root}/:sessionID/unrevert`,
  permissions: `${root}/:sessionID/permissions/:permissionID`,
  deleteMessage: `${root}/:sessionID/message/:messageID`,
  deletePart: `${root}/:sessionID/message/:messageID/part/:partID`,
  updatePart: `${root}/:sessionID/message/:messageID/part/:partID`,
} as const

export const makeSessionApi = (language?: Language) =>
  HttpApi.make("session")
    .add(
      HttpApiGroup.make("session")
        .add(
          HttpApiEndpoint.get("list", SessionPaths.list, {
            query: ListQuery,
            success: described(Schema.Array(Session.Info), t(language, "session_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.list",
              summary: t(language, "session_list"),
              description: t(language, "session_list_description"),
            }),
          ),
          HttpApiEndpoint.get("status", SessionPaths.status, {
            query: WorkspaceRoutingQuery,
            success: described(StatusMap, t(language, "legacy_session_status")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.status",
              summary: t(language, "legacy_session_status"),
              description: t(language, "legacy_session_status_description"),
            }),
          ),
          HttpApiEndpoint.get("get", SessionPaths.get, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Session.Info, t(language, "session_get")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.get",
              summary: t(language, "session_get"),
              description: t(language, "session_get_description"),
            }),
          ),
          HttpApiEndpoint.get("children", SessionPaths.children, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Session.Info), t(language, "legacy_session_children")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.children",
              summary: t(language, "legacy_session_children"),
              description: t(language, "legacy_session_children_description"),
            }),
          ),
          HttpApiEndpoint.get("todo", SessionPaths.todo, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Todo.Info), t(language, "legacy_session_todos")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.todo",
              summary: t(language, "legacy_session_todos"),
              description: t(language, "legacy_session_todos_description"),
            }),
          ),
          HttpApiEndpoint.get("diff", SessionPaths.diff, {
            params: { sessionID: SessionID },
            query: DiffQuery,
            success: described(Schema.Array(Snapshot.FileDiff), text(language, "response_diff_retrieved")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.diff",
              summary: t(language, "legacy_message_diff"),
              description: t(language, "legacy_message_diff_description"),
            }),
          ),
          HttpApiEndpoint.get("messages", SessionPaths.messages, {
            params: { sessionID: SessionID },
            query: MessagesQuery,
            success: described(Schema.Array(SessionV1.WithParts), text(language, "response_message_list")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.messages",
              summary: t(language, "legacy_session_messages"),
              description: t(language, "legacy_session_messages_description"),
            }),
          ),
          HttpApiEndpoint.get("message", SessionPaths.message, {
            params: { sessionID: SessionID, messageID: MessageID },
            query: WorkspaceRoutingQuery,
            success: described(SessionV1.WithParts, t(language, "legacy_message_get")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.message",
              summary: t(language, "legacy_message_get"),
              description: t(language, "legacy_message_get_description"),
            }),
          ),
          HttpApiEndpoint.post("create", SessionPaths.create, {
            query: WorkspaceRoutingQuery,
            payload: [HttpApiSchema.NoContent, Session.CreateInput],
            success: described(Session.Info, t(language, "session_create")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.create",
              summary: t(language, "session_create"),
              description: t(language, "session_create_description"),
            }),
          ),
          HttpApiEndpoint.delete("remove", SessionPaths.remove, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "legacy_session_delete")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.delete",
              summary: t(language, "legacy_session_delete"),
              description: t(language, "legacy_session_delete_description"),
            }),
          ),
          HttpApiEndpoint.patch("update", SessionPaths.update, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: UpdatePayload,
            success: described(Session.Info, t(language, "legacy_session_update")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.update",
              summary: t(language, "legacy_session_update"),
              description: t(language, "legacy_session_update_description"),
            }),
          ),
          HttpApiEndpoint.post("fork", SessionPaths.fork, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: [HttpApiSchema.NoContent, ForkPayload],
            success: described(Session.Info, text(language, "response_ok_status")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.fork",
              summary: t(language, "legacy_session_fork"),
              description: t(language, "legacy_session_fork_description"),
            }),
          ),
          HttpApiEndpoint.post("abort", SessionPaths.abort, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, text(language, "response_session_aborted")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.abort",
              summary: t(language, "legacy_session_abort"),
              description: t(language, "legacy_session_abort_description"),
            }),
          ),
          HttpApiEndpoint.post("init", SessionPaths.init, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: InitPayload,
            success: described(Schema.Boolean, text(language, "response_ok_status")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.init",
              summary: t(language, "legacy_session_initialize"),
              description: t(language, "legacy_session_initialize"),
            }),
          ),
          HttpApiEndpoint.post("share", SessionPaths.share, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Session.Info, text(language, "response_session_shared")),
            error: [HttpApiError.InternalServerError, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.share",
              summary: t(language, "legacy_session_share"),
              description: t(language, "legacy_session_share_description"),
            }),
          ),
          HttpApiEndpoint.delete("unshare", SessionPaths.share, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Session.Info, text(language, "response_session_unshared")),
            error: [HttpApiError.InternalServerError, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.unshare",
              summary: t(language, "legacy_session_unshare"),
              description: t(language, "legacy_session_unshare_description"),
            }),
          ),
          HttpApiEndpoint.post("summarize", SessionPaths.summarize, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: SummarizePayload,
            success: described(Schema.Boolean, text(language, "response_session_summarized")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.summarize",
              summary: t(language, "legacy_session_summarize"),
              description: t(language, "legacy_session_summarize_description"),
            }),
          ),
          HttpApiEndpoint.post("prompt", SessionPaths.prompt, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: PromptPayload,
            success: described(SessionV1.WithParts, text(language, "response_message_created")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.prompt",
              summary: t(language, "session_send_message"),
              description: t(language, "session_send_message_description"),
            }),
          ),
          HttpApiEndpoint.post("promptAsync", SessionPaths.promptAsync, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: PromptPayload,
            success: described(HttpApiSchema.NoContent, text(language, "response_prompt_accepted")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.prompt_async",
              summary: t(language, "legacy_session_async"),
              description: t(language, "session_send_message_description"),
            }),
          ),
          HttpApiEndpoint.post("continue", SessionPaths.continue, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: [HttpApiSchema.NoContent, ContinuePayload],
            success: described(HttpApiSchema.NoContent, text(language, "response_prompt_accepted")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.continue",
              summary: t(language, "legacy_session_continue"),
              description: t(language, "legacy_session_continue_description"),
            }),
          ),
          HttpApiEndpoint.post("command", SessionPaths.command, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: CommandPayload,
            success: described(SessionV1.WithParts, text(language, "response_message_created")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.command",
              summary: t(language, "legacy_session_command"),
              description: t(language, "legacy_session_command_description"),
            }),
          ),
          HttpApiEndpoint.post("shell", SessionPaths.shell, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: ShellPayload,
            success: described(SessionV1.WithParts, text(language, "response_message_created")),
            error: [HttpApiError.BadRequest, ApiNotFoundError, SessionBusyError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.shell",
              summary: t(language, "legacy_session_shell"),
              description: t(language, "legacy_session_shell_description"),
            }),
          ),
          HttpApiEndpoint.post("revert", SessionPaths.revert, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            payload: RevertPayload,
            success: described(Session.Info, text(language, "response_session_updated")),
            error: [HttpApiError.BadRequest, ApiNotFoundError, SessionBusyError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.revert",
              summary: t(language, "legacy_session_revert"),
              description: t(language, "legacy_session_revert_description"),
            }),
          ),
          HttpApiEndpoint.post("unrevert", SessionPaths.unrevert, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Session.Info, text(language, "response_session_updated")),
            error: [HttpApiError.BadRequest, ApiNotFoundError, SessionBusyError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.unrevert",
              summary: t(language, "legacy_session_restore"),
              description: t(language, "legacy_session_restore_description"),
            }),
          ),
          HttpApiEndpoint.post("permissionRespond", SessionPaths.permissions, {
            params: { sessionID: SessionID, permissionID: PermissionV1.ID },
            query: WorkspaceRoutingQuery,
            payload: PermissionResponsePayload,
            success: described(Schema.Boolean, text(language, "response_permission_processed")),
            error: [HttpApiError.BadRequest, ApiNotFoundError, PermissionNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "permission.respond",
              summary: t(language, "legacy_permission_reply"),
              description: t(language, "legacy_permission_reply_description"),
              deprecated: true,
            }),
          ),
          HttpApiEndpoint.delete("deleteMessage", SessionPaths.deleteMessage, {
            params: { sessionID: SessionID, messageID: MessageID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, text(language, "response_message_deleted")),
            error: [HttpApiError.BadRequest, ApiNotFoundError, SessionBusyError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "session.deleteMessage",
              summary: t(language, "legacy_message_delete"),
              description: text(language, "session_delete_message_description"),
            }),
          ),
          HttpApiEndpoint.delete("deletePart", SessionPaths.deletePart, {
            params: { sessionID: SessionID, messageID: MessageID, partID: PartID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, text(language, "response_part_deleted")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "part.delete",
              summary: t(language, "legacy_part_delete"),
              description: t(language, "legacy_part_delete"),
            }),
          ),
          HttpApiEndpoint.patch("updatePart", SessionPaths.updatePart, {
            params: { sessionID: SessionID, messageID: MessageID, partID: PartID },
            query: WorkspaceRoutingQuery,
            payload: SessionV1.Part,
            success: described(SessionV1.Part, text(language, "response_part_updated")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "part.update",
              summary: t(language, "legacy_part_update"),
              description: t(language, "legacy_part_update"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: t(language, "session_title"),
            description: t(language, "legacy_session_routes"),
          }),
        )
        .middleware(InstanceContextMiddleware)
        .middleware(WorkspaceRoutingMiddleware)
        .middleware(Authorization),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "legacy_httpapi_surface"),
        version: "0.0.1",
        description: t(language, "legacy_httpapi_surface"),
      }),
    )

export const SessionApi = makeSessionApi()
