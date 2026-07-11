import { PermissionV1 } from "@miaopan-code/core/v1/permission"
import { Permission } from "@/permission"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { PermissionNotFoundError } from "../errors"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/permission"
const ReplyPayload = Schema.Struct({
  reply: PermissionV1.Reply,
  message: Schema.optional(Schema.String),
})

export const makePermissionApi = (language?: Language) =>
  HttpApi.make("permission")
    .add(
      HttpApiGroup.make("permission")
        .add(
          HttpApiEndpoint.get("list", root, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(PermissionV1.Request), t(language, "response_pending_permissions")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "permission.list",
              summary: t(language, "permission_list"),
              description: t(language, "permission_list_description"),
            }),
          ),
          HttpApiEndpoint.post("reply", `${root}/:requestID/reply`, {
            params: { requestID: PermissionV1.ID },
            query: WorkspaceRoutingQuery,
            payload: ReplyPayload,
            success: described(Schema.Boolean, t(language, "response_permission_processed")),
            error: [HttpApiError.BadRequest, PermissionNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "permission.reply",
              summary: t(language, "permission_respond"),
              description: t(language, "permission_respond_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "permission",
            description: t(language, "permission_routes"),
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

export const PermissionApi = makePermissionApi()
