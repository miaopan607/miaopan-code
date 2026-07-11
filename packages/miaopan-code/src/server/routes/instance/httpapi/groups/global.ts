import { ConfigV1 } from "@miaopan-code/core/v1/config/config"
import { EventV2 } from "@miaopan-code/core/event"
import { EventManifest } from "@/event-manifest"
import { InstanceDisposed } from "@/server/event"
import "@miaopan-code/core/account"
import "@/server/event"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const GlobalHealth = Schema.Struct({
  healthy: Schema.Literal(true),
  version: Schema.String,
})

const SyncEventSchemas = EventManifest.Latest.values()
  .flatMap((definition) => {
    if (!definition.durable) return []
    return [
      Schema.Struct({
        type: Schema.Literal("sync"),
        id: EventV2.ID,
        syncEvent: Schema.Struct({
          type: Schema.Literal(EventV2.versionedType(definition.type, definition.durable.version)),
          id: EventV2.ID,
          seq: Schema.Finite,
          aggregateID: Schema.String,
          data: definition.data,
        }),
      }).annotate({ identifier: `SyncEvent.${definition.type}` }),
    ]
  })
  .toArray()

const GlobalEventSchema = Schema.Struct({
  directory: Schema.String,
  project: Schema.optional(Schema.String),
  workspace: Schema.optional(Schema.String),
  payload: Schema.Union([
    ...EventManifest.Latest.values()
      .map((definition) =>
        Schema.Struct({ id: EventV2.ID, type: Schema.Literal(definition.type), properties: definition.data }),
      )
      .toArray(),
    InstanceDisposed,
    ...SyncEventSchemas,
  ]),
}).annotate({ identifier: "GlobalEvent" })

export const GlobalUpgradeInput = Schema.Struct({
  target: Schema.optional(Schema.String),
})

const GlobalUpgradeResult = Schema.Union([
  Schema.Struct({
    success: Schema.Literal(true),
    version: Schema.String,
  }),
  Schema.Struct({
    success: Schema.Literal(false),
    error: Schema.String,
  }),
])

export const GlobalPaths = {
  health: "/global/health",
  event: "/global/event",
  config: "/global/config",
  dispose: "/global/dispose",
  upgrade: "/global/upgrade",
} as const

export const makeGlobalApi = (language?: Language) =>
  HttpApi.make("global").add(
    HttpApiGroup.make("global")
      .add(
        HttpApiEndpoint.get("health", GlobalPaths.health, {
          success: described(GlobalHealth, t(language, "response_health_information")),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "global.health",
            summary: t(language, "global_health"),
            description: t(language, "global_health_description"),
          }),
        ),
        HttpApiEndpoint.get("event", GlobalPaths.event, {
          success: GlobalEventSchema,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "global.event",
            summary: t(language, "global_events"),
            description: t(language, "global_events_description"),
          }),
        ),
        HttpApiEndpoint.get("configGet", GlobalPaths.config, {
          success: described(ConfigV1.Info, t(language, "response_global_config")),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "global.config.get",
            summary: t(language, "global_config"),
            description: t(language, "global_config_description"),
          }),
        ),
        HttpApiEndpoint.patch("configUpdate", GlobalPaths.config, {
          payload: ConfigV1.Info,
          success: described(ConfigV1.Info, t(language, "response_global_config_updated")),
          error: HttpApiError.BadRequest,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "global.config.update",
            summary: t(language, "global_update_config"),
            description: t(language, "global_config_description"),
          }),
        ),
        HttpApiEndpoint.post("dispose", GlobalPaths.dispose, {
          success: described(Schema.Boolean, t(language, "response_global_disposed")),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "global.dispose",
            summary: t(language, "global_dispose"),
            description: t(language, "global_dispose_description"),
          }),
        ),
        HttpApiEndpoint.post("upgrade", GlobalPaths.upgrade, {
          payload: [HttpApiSchema.NoContent, GlobalUpgradeInput],
          success: described(GlobalUpgradeResult, t(language, "response_upgrade_result")),
          error: HttpApiError.BadRequest,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "global.upgrade",
            summary: t(language, "global_upgrade"),
            description: t(language, "global_upgrade_description"),
          }),
        ),
      )
      .annotateMerge(OpenApi.annotations({ title: "global", description: t(language, "global_routes") })),
  )

export const GlobalApi = makeGlobalApi()
