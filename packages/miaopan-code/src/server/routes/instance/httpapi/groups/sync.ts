import { NonNegativeInt } from "@miaopan-code/core/schema"
import { EventV2 } from "@miaopan-code/core/event"
import { SessionID } from "@/session/schema"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { t, type Language } from "@miaopan-code/protocol/i18n"
import { described } from "./metadata"

const root = "/sync"
export const ReplayEvent = Schema.Struct({
  id: EventV2.ID,
  aggregateID: Schema.String,
  seq: NonNegativeInt,
  type: Schema.String,
  data: Schema.Record(Schema.String, Schema.Unknown),
})
export const ReplayPayload = Schema.Struct({
  directory: Schema.String,
  events: Schema.NonEmptyArray(ReplayEvent),
})
export const ReplayResponse = Schema.Struct({
  sessionID: Schema.String,
})
export const SessionPayload = Schema.Struct({
  sessionID: SessionID,
})
export const HistoryPayload = Schema.Record(Schema.String, NonNegativeInt)
export const HistoryEvent = Schema.Struct({
  id: EventV2.ID,
  aggregate_id: Schema.String,
  seq: NonNegativeInt,
  type: Schema.String,
  data: Schema.Record(Schema.String, Schema.Unknown),
})

export const SyncPaths = {
  start: `${root}/start`,
  replay: `${root}/replay`,
  steal: `${root}/steal`,
  history: `${root}/history`,
} as const

export const makeSyncApi = (language?: Language) =>
  HttpApi.make("sync")
    .add(
      HttpApiGroup.make("sync")
        .add(
          HttpApiEndpoint.post("start", SyncPaths.start, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "legacy_sync_start")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "sync.start",
              summary: t(language, "legacy_sync_start"),
              description: t(language, "legacy_sync_start_description"),
            }),
          ),
          HttpApiEndpoint.post("replay", SyncPaths.replay, {
            query: WorkspaceRoutingQuery,
            payload: ReplayPayload,
            success: described(ReplayResponse, t(language, "legacy_sync_replay")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "sync.replay",
              summary: t(language, "legacy_sync_replay"),
              description: t(language, "legacy_sync_replay_description"),
            }),
          ),
          HttpApiEndpoint.post("steal", SyncPaths.steal, {
            query: WorkspaceRoutingQuery,
            payload: SessionPayload,
            success: described(SessionPayload, t(language, "legacy_sync_steal")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "sync.steal",
              summary: t(language, "legacy_sync_steal"),
              description: t(language, "legacy_sync_steal_description"),
            }),
          ),
          HttpApiEndpoint.post("history", SyncPaths.history, {
            query: WorkspaceRoutingQuery,
            payload: HistoryPayload,
            success: described(Schema.Array(HistoryEvent), t(language, "legacy_sync_list")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "sync.history.list",
              summary: t(language, "legacy_sync_list"),
              description: t(language, "legacy_sync_list"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "sync",
            description: t(language, "legacy_sync_description"),
          }),
        )
        .middleware(InstanceContextMiddleware)
        .middleware(WorkspaceRoutingMiddleware)
        .middleware(Authorization),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "api_title"),
        version: "0.0.1",
        description: t(language, "legacy_httpapi_surface"),
      }),
    )

export const SyncApi = makeSyncApi()
