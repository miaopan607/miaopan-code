import { Pty } from "@miaopan-code/core/pty"
import { PtyTicket } from "@miaopan-code/core/pty/ticket"
import { PtyID } from "@miaopan-code/core/pty/schema"
import { PTY_CONNECT_TICKET_QUERY } from "@/server/shared/pty-ticket"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization, PtyConnectAuthorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import {
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingQuery,
  WorkspaceRoutingQueryFields,
} from "../middleware/workspace-routing"
import { PtyForbiddenError, PtyNotFoundError } from "../errors"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/pty"
export const Params = Schema.Struct({ ptyID: PtyID })
export const CursorQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  cursor: Schema.optional(Schema.String),
})
export const ShellItem = Schema.Struct({
  path: Schema.String,
  name: Schema.String,
  acceptable: Schema.Boolean,
})

export const PtyPaths = {
  shells: `${root}/shells`,
  list: root,
  create: root,
  get: `${root}/:ptyID`,
  update: `${root}/:ptyID`,
  remove: `${root}/:ptyID`,
  connectToken: `${root}/:ptyID/connect-token`,
  connect: `${root}/:ptyID/connect`,
} as const

export const makePtyApi = (language?: Language) =>
  HttpApi.make("pty")
    .add(
      HttpApiGroup.make("pty")
        .add(
          HttpApiEndpoint.get("shells", PtyPaths.shells, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(ShellItem), t(language, "response_shell_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.shells",
              summary: t(language, "pty_shells"),
              description: t(language, "pty_shells_description"),
            }),
          ),
          HttpApiEndpoint.get("list", PtyPaths.list, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Pty.Info), t(language, "response_session_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.list",
              summary: t(language, "pty_list"),
              description: t(language, "pty_list_description"),
            }),
          ),
          HttpApiEndpoint.post("create", PtyPaths.create, {
            query: WorkspaceRoutingQuery,
            payload: Pty.CreateInput,
            success: described(Pty.Info, t(language, "response_session_created")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.create",
              summary: t(language, "pty_create"),
              description: t(language, "pty_create_description"),
            }),
          ),
          HttpApiEndpoint.get("get", PtyPaths.get, {
            params: { ptyID: PtyID },
            query: WorkspaceRoutingQuery,
            success: described(Pty.Info, t(language, "response_session_info")),
            error: PtyNotFoundError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.get",
              summary: t(language, "pty_get"),
              description: t(language, "pty_get_description"),
            }),
          ),
          HttpApiEndpoint.put("update", PtyPaths.update, {
            params: { ptyID: PtyID },
            query: WorkspaceRoutingQuery,
            payload: Pty.UpdateInput,
            success: described(Pty.Info, t(language, "response_session_updated")),
            error: [PtyNotFoundError, HttpApiError.BadRequest],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.update",
              summary: t(language, "pty_update"),
              description: t(language, "pty_update_description"),
            }),
          ),
          HttpApiEndpoint.delete("remove", PtyPaths.remove, {
            params: { ptyID: PtyID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_session_removed")),
            error: PtyNotFoundError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.remove",
              summary: t(language, "pty_remove"),
              description: t(language, "pty_remove_description"),
            }),
          ),
          HttpApiEndpoint.post("connectToken", PtyPaths.connectToken, {
            params: { ptyID: PtyID },
            query: WorkspaceRoutingQuery,
            success: described(PtyTicket.ConnectToken, t(language, "response_websocket_connect_token")),
            error: [PtyForbiddenError, PtyNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "pty.connectToken",
              summary: t(language, "pty_token"),
              description: t(language, "pty_token_description"),
            }),
          ),
        )
        .annotateMerge(OpenApi.annotations({ title: "pty", description: t(language, "pty_routes") }))
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

export const makePtyConnectApi = (language?: Language) =>
  HttpApi.make("pty-connect").add(
    HttpApiGroup.make("pty-connect")
      .add(
        // Decode PTY connection query fields in the raw handler after checking
        // existence, preserving the established empty-404 response ordering.
        HttpApiEndpoint.get("connect", PtyPaths.connect, {
          params: Params,
          success: described(Schema.Boolean, t(language, "response_session_connected")),
          error: [HttpApiError.Forbidden, HttpApiError.NotFound],
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "pty.connect",
            summary: t(language, "pty_connect"),
            description: t(language, "pty_connect_description"),
            transform: (operation) => ({
              ...operation,
              parameters: [
                ...(operation.parameters ?? []),
                ...["directory", "workspace", "cursor", PTY_CONNECT_TICKET_QUERY].map((name) => ({
                  in: "query",
                  name,
                  schema: { type: "string" },
                })),
              ],
            }),
          }),
        ),
      )
      .annotateMerge(OpenApi.annotations({ title: "pty", description: t(language, "pty_websocket_route") }))
      .middleware(InstanceContextMiddleware)
      .middleware(WorkspaceRoutingMiddleware)
      .middleware(PtyConnectAuthorization),
  )

export const PtyApi = makePtyApi()
export const PtyConnectApi = makePtyConnectApi()
