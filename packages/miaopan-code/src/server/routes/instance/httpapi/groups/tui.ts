import { TuiEvent } from "@/server/tui-event"
import { TuiRequest as TuiRequestPayload } from "@/server/shared/tui-control"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { ApiNotFoundError } from "../errors"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/tui"
export const CommandPayload = Schema.Struct({ command: Schema.String })
const EventTuiPromptAppend = Schema.Struct({
  type: Schema.Literal(TuiEvent.PromptAppend.type),
  properties: TuiEvent.PromptAppend.data,
}).annotate({ identifier: "EventTuiPromptAppend" })
const EventTuiCommandExecute = Schema.Struct({
  type: Schema.Literal(TuiEvent.CommandExecute.type),
  properties: TuiEvent.CommandExecute.data,
}).annotate({ identifier: "EventTuiCommandExecute" })
const EventTuiToastShow = Schema.Struct({
  type: Schema.Literal(TuiEvent.ToastShow.type),
  properties: TuiEvent.ToastShow.data,
}).annotate({ identifier: "EventTuiToastShow" })
const EventTuiSessionSelect = Schema.Struct({
  type: Schema.Literal(TuiEvent.SessionSelect.type),
  properties: TuiEvent.SessionSelect.data,
}).annotate({ identifier: "EventTuiSessionSelect" })
export const TuiPublishPayload = Schema.Union([
  EventTuiPromptAppend,
  EventTuiCommandExecute,
  EventTuiToastShow,
  EventTuiSessionSelect,
])

export const TuiPaths = {
  appendPrompt: `${root}/append-prompt`,
  openHelp: `${root}/open-help`,
  openSessions: `${root}/open-sessions`,
  openThemes: `${root}/open-themes`,
  openModels: `${root}/open-models`,
  submitPrompt: `${root}/submit-prompt`,
  clearPrompt: `${root}/clear-prompt`,
  executeCommand: `${root}/execute-command`,
  showToast: `${root}/show-toast`,
  publish: `${root}/publish`,
  selectSession: `${root}/select-session`,
  controlNext: `${root}/control/next`,
  controlResponse: `${root}/control/response`,
} as const

export const makeTuiApi = (language?: Language) =>
  HttpApi.make("tui")
    .add(
      HttpApiGroup.make("tui")
        .add(
          HttpApiEndpoint.post("appendPrompt", TuiPaths.appendPrompt, {
            query: WorkspaceRoutingQuery,
            payload: TuiEvent.PromptAppend.data,
            success: described(Schema.Boolean, t(language, "response_prompt_processed")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.appendPrompt",
              summary: t(language, "tui_append"),
              description: t(language, "tui_append_description"),
            }),
          ),
          HttpApiEndpoint.post("openHelp", TuiPaths.openHelp, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_help_dialog_opened")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.openHelp",
              summary: t(language, "tui_help"),
              description: t(language, "tui_help"),
            }),
          ),
          HttpApiEndpoint.post("openSessions", TuiPaths.openSessions, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_session_dialog_opened")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.openSessions",
              summary: t(language, "tui_sessions"),
              description: t(language, "tui_sessions"),
            }),
          ),
          HttpApiEndpoint.post("openThemes", TuiPaths.openThemes, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_theme_dialog_opened")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.openThemes",
              summary: t(language, "tui_themes"),
              description: t(language, "tui_themes"),
            }),
          ),
          HttpApiEndpoint.post("openModels", TuiPaths.openModels, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_model_dialog_opened")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.openModels",
              summary: t(language, "tui_models"),
              description: t(language, "tui_models"),
            }),
          ),
          HttpApiEndpoint.post("submitPrompt", TuiPaths.submitPrompt, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_prompt_submitted")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.submitPrompt",
              summary: t(language, "tui_submit"),
              description: t(language, "tui_submit"),
            }),
          ),
          HttpApiEndpoint.post("clearPrompt", TuiPaths.clearPrompt, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_prompt_cleared")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.clearPrompt",
              summary: t(language, "tui_clear"),
              description: t(language, "tui_clear"),
            }),
          ),
          HttpApiEndpoint.post("executeCommand", TuiPaths.executeCommand, {
            query: WorkspaceRoutingQuery,
            payload: CommandPayload,
            success: described(Schema.Boolean, t(language, "response_command_executed")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.executeCommand",
              summary: t(language, "tui_execute"),
              description: t(language, "tui_execute"),
            }),
          ),
          HttpApiEndpoint.post("showToast", TuiPaths.showToast, {
            query: WorkspaceRoutingQuery,
            payload: TuiEvent.ToastShow.data,
            success: described(Schema.Boolean, t(language, "response_toast_shown")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.showToast",
              summary: t(language, "tui_toast"),
              description: t(language, "tui_toast"),
            }),
          ),
          HttpApiEndpoint.post("publish", TuiPaths.publish, {
            query: WorkspaceRoutingQuery,
            payload: TuiPublishPayload,
            success: described(Schema.Boolean, t(language, "response_event_published")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.publish",
              summary: t(language, "tui_event"),
              description: t(language, "tui_event"),
            }),
          ),
          HttpApiEndpoint.post("selectSession", TuiPaths.selectSession, {
            query: WorkspaceRoutingQuery,
            payload: TuiEvent.SessionSelect.data,
            success: described(Schema.Boolean, t(language, "response_session_selected")),
            error: [HttpApiError.BadRequest, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.selectSession",
              summary: t(language, "tui_select_session"),
              description: t(language, "tui_select_session"),
            }),
          ),
          HttpApiEndpoint.get("controlNext", TuiPaths.controlNext, {
            query: WorkspaceRoutingQuery,
            success: described(TuiRequestPayload, t(language, "response_next_tui_request")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.control.next",
              summary: t(language, "tui_request_next"),
              description: t(language, "tui_request_next"),
            }),
          ),
          HttpApiEndpoint.post("controlResponse", TuiPaths.controlResponse, {
            query: WorkspaceRoutingQuery,
            payload: Schema.Unknown,
            success: described(Schema.Boolean, t(language, "response_tui_response_submitted")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tui.control.response",
              summary: t(language, "tui_response"),
              description: t(language, "tui_response"),
            }),
          ),
        )
        .annotateMerge(OpenApi.annotations({ title: "tui", description: t(language, "tui_routes") }))
        .middleware(InstanceContextMiddleware)
        .middleware(WorkspaceRoutingMiddleware)
        .middleware(Authorization),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "httpapi_title"),
        version: "0.0.1",
        description: t(language, "httpapi_title"),
      }),
    )

export const TuiApi = makeTuiApi()
