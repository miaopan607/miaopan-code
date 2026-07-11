import { Pty } from "@miaopan-code/schema/pty"
import { PtyTicket } from "@miaopan-code/schema/pty-ticket"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { ForbiddenError, PtyNotFoundError } from "../errors"
import { LocationQuery, locationQueryOpenApi } from "./location"
import { t, type Language } from "../i18n"

export const PTY_CONNECT_TICKET_QUERY = "ticket"
export const PTY_CONNECT_TOKEN_HEADER = "x-miaopanCode-ticket"
export const PTY_CONNECT_TOKEN_HEADER_VALUE = "1"

const PTY_CONNECT_PATH = /^\/api\/pty\/[^/]+\/connect$/

// Authorization middleware skips credential checks when this matches; the PTY connect handler
// is then responsible for consuming and validating the ticket.
export function hasPtyConnectTicketURL(url: URL) {
  return PTY_CONNECT_PATH.test(url.pathname) && !!url.searchParams.get(PTY_CONNECT_TICKET_QUERY)
}

export const makePtyGroup = (language?: Language) =>
  HttpApiGroup.make("server.pty")
    .add(
      HttpApiEndpoint.get("pty.list", "/api/pty", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Pty.Info)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.pty.list",
            summary: t(language, "pty_list"),
            description: t(language, "pty_list_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("pty.create", "/api/pty", {
        query: LocationQuery,
        payload: Pty.CreateInput,
        success: Location.response(Pty.Info),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.pty.create",
            summary: t(language, "pty_create"),
            description: t(language, "pty_create_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("pty.get", "/api/pty/:ptyID", {
        params: { ptyID: Pty.ID },
        query: LocationQuery,
        success: Location.response(Pty.Info),
        error: PtyNotFoundError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.pty.get",
            summary: t(language, "pty_get"),
            description: t(language, "pty_get_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.put("pty.update", "/api/pty/:ptyID", {
        params: { ptyID: Pty.ID },
        query: LocationQuery,
        payload: Pty.UpdateInput,
        success: Location.response(Pty.Info),
        error: PtyNotFoundError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.pty.update",
            summary: t(language, "pty_update"),
            description: t(language, "pty_update_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.delete("pty.remove", "/api/pty/:ptyID", {
        params: { ptyID: Pty.ID },
        query: LocationQuery,
        success: HttpApiSchema.NoContent,
        error: PtyNotFoundError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.pty.remove",
            summary: t(language, "pty_remove"),
            description: t(language, "pty_remove_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("pty.connectToken", "/api/pty/:ptyID/connect-token", {
        params: { ptyID: Pty.ID },
        query: LocationQuery,
        success: Location.response(PtyTicket.ConnectToken),
        error: [ForbiddenError, PtyNotFoundError],
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.pty.connectToken",
            summary: t(language, "pty_token"),
            description: t(language, "pty_token_description"),
          }),
        ),
    )
    .add(
      // Query fields are decoded in the raw handler after the existence check so a missing
      // session responds with an empty 404 before any upgrade work.
      HttpApiEndpoint.get("pty.connect", "/api/pty/:ptyID/connect", {
        params: { ptyID: Pty.ID },
        success: Schema.Boolean,
        error: [ForbiddenError, PtyNotFoundError],
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "v2.pty.connect",
          summary: t(language, "pty_connect"),
          description: t(language, "pty_connect_description"),
          transform: (operation) => ({
            ...operation,
            "x-websocket": true,
            parameters: [
              ...(operation.parameters ?? []),
              ...["location[directory]", "location[workspace]", "cursor", PTY_CONNECT_TICKET_QUERY].map((name) => ({
                in: "query",
                name,
                schema: { type: "string" },
              })),
            ],
          }),
        }),
      ),
    )
    .annotateMerge(
      OpenApi.annotations({ title: t(language, "pty_title"), description: t(language, "pty_description") }),
    )

export const PtyGroup = makePtyGroup()
