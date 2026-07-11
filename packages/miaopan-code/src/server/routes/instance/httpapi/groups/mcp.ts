import { MCP } from "@/mcp"
import { ConfigMCPV1 } from "@miaopan-code/core/v1/config/mcp"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { McpServerNotFoundError } from "../errors"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

export const AddPayload = Schema.Struct({
  name: Schema.String,
  config: ConfigMCPV1.Info,
})

export const StatusMap = Schema.Record(Schema.String, MCP.Status)
export const AuthStartResponse = Schema.Struct({
  authorizationUrl: Schema.String,
  oauthState: Schema.String,
})
export const AuthCallbackPayload = Schema.Struct({
  code: Schema.String,
})
export const AuthRemoveResponse = Schema.Struct({
  success: Schema.Literal(true),
})
export class UnsupportedOAuthError extends Schema.ErrorClass<UnsupportedOAuthError>("McpUnsupportedOAuthError")(
  { error: Schema.String },
  { httpApiStatus: 400 },
) {}

export const McpPaths = {
  status: "/mcp",
  auth: "/mcp/:name/auth",
  authCallback: "/mcp/:name/auth/callback",
  authAuthenticate: "/mcp/:name/auth/authenticate",
  connect: "/mcp/:name/connect",
  disconnect: "/mcp/:name/disconnect",
} as const

export const makeMcpApi = (language?: Language) =>
  HttpApi.make("mcp")
    .add(
      HttpApiGroup.make("mcp")
        .add(
          HttpApiEndpoint.get("status", McpPaths.status, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Record(Schema.String, MCP.Status), t(language, "response_mcp_status")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.status",
              summary: t(language, "mcp_status"),
              description: t(language, "mcp_status_description"),
            }),
          ),
          HttpApiEndpoint.post("add", McpPaths.status, {
            query: WorkspaceRoutingQuery,
            payload: AddPayload,
            success: described(StatusMap, t(language, "response_mcp_added")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.add",
              summary: t(language, "mcp_add"),
              description: t(language, "mcp_add_description"),
            }),
          ),
          HttpApiEndpoint.post("authStart", McpPaths.auth, {
            params: { name: Schema.String },
            query: WorkspaceRoutingQuery,
            success: described(AuthStartResponse, t(language, "response_oauth_flow_started")),
            error: [UnsupportedOAuthError, McpServerNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.auth.start",
              summary: t(language, "mcp_oauth_start"),
              description: t(language, "mcp_oauth_start_description"),
            }),
          ),
          HttpApiEndpoint.post("authCallback", McpPaths.authCallback, {
            params: { name: Schema.String },
            query: WorkspaceRoutingQuery,
            payload: AuthCallbackPayload,
            success: described(MCP.Status, t(language, "response_oauth_auth_completed")),
            error: [HttpApiError.BadRequest, McpServerNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.auth.callback",
              summary: t(language, "mcp_oauth_start"),
              description: t(language, "mcp_oauth_complete_description"),
            }),
          ),
          HttpApiEndpoint.post("authAuthenticate", McpPaths.authAuthenticate, {
            params: { name: Schema.String },
            query: WorkspaceRoutingQuery,
            success: described(MCP.Status, t(language, "response_oauth_auth_completed")),
            error: [UnsupportedOAuthError, McpServerNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.auth.authenticate",
              summary: t(language, "mcp_oauth_authenticate"),
              description: t(language, "mcp_oauth_authenticate_description"),
            }),
          ),
          HttpApiEndpoint.delete("authRemove", McpPaths.auth, {
            params: { name: Schema.String },
            query: WorkspaceRoutingQuery,
            success: described(AuthRemoveResponse, t(language, "response_oauth_credentials_removed")),
            error: McpServerNotFoundError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.auth.remove",
              summary: t(language, "mcp_oauth_remove"),
              description: t(language, "mcp_oauth_remove_description"),
            }),
          ),
          HttpApiEndpoint.post("connect", McpPaths.connect, {
            params: { name: Schema.String },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_mcp_connected")),
            error: McpServerNotFoundError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.connect",
              description: t(language, "mcp_connect"),
            }),
          ),
          HttpApiEndpoint.post("disconnect", McpPaths.disconnect, {
            params: { name: Schema.String },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_mcp_disconnected")),
            error: McpServerNotFoundError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "mcp.disconnect",
              description: t(language, "mcp_disconnect"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "mcp",
            description: t(language, "mcp_routes"),
          }),
        )
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

export const McpApi = makeMcpApi()
