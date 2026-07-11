import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { t, type Language } from "@miaopan-code/protocol/i18n"

export const EventPaths = {
  event: "/event",
} as const

export const makeEventApi = (language?: Language) =>
  HttpApi.make("event").add(
    HttpApiGroup.make("event")
      .add(
        HttpApiEndpoint.get("subscribe", EventPaths.event, {
          query: WorkspaceRoutingQuery,
          success: Schema.String.pipe(HttpApiSchema.asText({ contentType: "text/event-stream" })),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "event.subscribe",
            summary: t(language, "session_events"),
            description: t(language, "session_events_description"),
          }),
        ),
      )
      .middleware(InstanceContextMiddleware)
      .middleware(WorkspaceRoutingMiddleware)
      .middleware(Authorization)
      .annotateMerge(OpenApi.annotations({ title: "event", description: t(language, "session_events_description") })),
  )

export const EventApi = makeEventApi()
