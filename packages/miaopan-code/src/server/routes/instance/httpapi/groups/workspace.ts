import { Workspace } from "@/control-plane/workspace"
import { WorkspaceAdapterEntry } from "@/control-plane/types"
import { Schema, Struct } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { ApiVcsApplyError } from "./instance"
import { ApiNotFoundError } from "../errors"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/experimental/workspace"
export const CreatePayload = Schema.Struct(Struct.omit(Workspace.CreateInput.fields, ["projectID"]))
export const WarpPayload = Schema.Struct({
  id: Schema.NullOr(Workspace.Info.fields.id),
  sessionID: Workspace.SessionWarpInput.fields.sessionID,
  copyChanges: Workspace.SessionWarpInput.fields.copyChanges,
})

export class ApiWorkspaceWarpError extends Schema.ErrorClass<ApiWorkspaceWarpError>("WorkspaceWarpError")(
  {
    name: Schema.Literal("WorkspaceWarpError"),
    data: Schema.Struct({
      message: Schema.String,
    }),
  },
  { httpApiStatus: 400 },
) {}

export class ApiWorkspaceCreateError extends Schema.ErrorClass<ApiWorkspaceCreateError>("WorkspaceCreateError")(
  {
    name: Schema.Literal("WorkspaceCreateError"),
    data: Schema.Struct({
      message: Schema.String,
    }),
  },
  { httpApiStatus: 400 },
) {}

export const WorkspacePaths = {
  adapters: `${root}/adapter`,
  list: root,
  syncList: `${root}/sync-list`,
  status: `${root}/status`,
  remove: `${root}/:id`,
  warp: `${root}/warp`,
} as const

export const makeWorkspaceApi = (language?: Language) =>
  HttpApi.make("workspace")
    .add(
      HttpApiGroup.make("workspace")
        .add(
          HttpApiEndpoint.get("adapters", WorkspacePaths.adapters, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(WorkspaceAdapterEntry), t(language, "response_workspace_adapters")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.adapter.list",
              summary: t(language, "workspace_adapters"),
              description: t(language, "workspace_adapters_description"),
            }),
          ),
          HttpApiEndpoint.get("list", WorkspacePaths.list, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Workspace.Info), t(language, "response_workspaces")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.list",
              summary: t(language, "workspace_list"),
              description: t(language, "workspace_list_description"),
            }),
          ),
          HttpApiEndpoint.post("create", WorkspacePaths.list, {
            query: WorkspaceRoutingQuery,
            payload: CreatePayload,
            success: described(Workspace.Info, t(language, "response_workspace_created")),
            error: [ApiWorkspaceCreateError, HttpApiError.BadRequest],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.create",
              summary: t(language, "workspace_create"),
              description: t(language, "workspace_create_description"),
            }),
          ),
          HttpApiEndpoint.post("syncList", WorkspacePaths.syncList, {
            query: WorkspaceRoutingQuery,
            success: described(HttpApiSchema.NoContent, t(language, "response_workspace_list_synced")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.syncList",
              summary: t(language, "workspace_sync"),
              description: t(language, "workspace_sync_description"),
            }),
          ),
          HttpApiEndpoint.get("status", WorkspacePaths.status, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Workspace.ConnectionStatus), t(language, "response_workspace_status")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.status",
              summary: t(language, "workspace_status"),
              description: t(language, "workspace_status_description"),
            }),
          ),
          HttpApiEndpoint.delete("remove", WorkspacePaths.remove, {
            params: { id: Workspace.Info.fields.id },
            query: WorkspaceRoutingQuery,
            success: described(Schema.UndefinedOr(Workspace.Info), t(language, "response_workspace_removed")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.remove",
              summary: t(language, "workspace_remove"),
              description: t(language, "workspace_remove_description"),
            }),
          ),
          HttpApiEndpoint.post("warp", WorkspacePaths.warp, {
            query: WorkspaceRoutingQuery,
            payload: WarpPayload,
            success: described(HttpApiSchema.NoContent, t(language, "response_session_warped")),
            error: [ApiWorkspaceWarpError, ApiVcsApplyError, ApiNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.workspace.warp",
              summary: t(language, "workspace_warp"),
              description: t(language, "workspace_warp_description"),
            }),
          ),
        )
        .annotateMerge(OpenApi.annotations({ title: "workspace", description: t(language, "workspace_routes") }))
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

export const WorkspaceApi = makeWorkspaceApi()
