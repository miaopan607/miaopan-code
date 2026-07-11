import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"

export const makeHealthGroup = (language?: Language) =>
  HttpApiGroup.make("server.health").add(
    HttpApiEndpoint.get("health.get", "/api/health", {
      success: Schema.Struct({ healthy: Schema.Literal(true) }),
    }).annotateMerge(
      OpenApi.annotations({
        identifier: "v2.health.get",
        summary: t(language, "health_summary"),
        description: t(language, "health_description"),
      }),
    ),
  )

export const HealthGroup = makeHealthGroup()
