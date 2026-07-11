import { Integration } from "@miaopan-code/schema/integration"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { InvalidRequestError } from "../errors"
import { LocationQuery, locationQueryOpenApi } from "./location"
import { t, type Language } from "../i18n"

const Inputs = Schema.Record(Schema.String, Schema.String)

export const makeIntegrationGroup = (language?: Language) =>
  HttpApiGroup.make("server.integration")
    .add(
      HttpApiEndpoint.get("integration.list", "/api/integration", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Integration.Info)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.list",
            summary: t(language, "integration_list"),
            description: t(language, "integration_list_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("integration.get", "/api/integration/:integrationID", {
        params: { integrationID: Integration.ID },
        query: LocationQuery,
        success: Location.response(Schema.UndefinedOr(Integration.Info)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.get",
            summary: t(language, "integration_get"),
            description: t(language, "integration_get_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("integration.connect.key", "/api/integration/:integrationID/connect/key", {
        params: { integrationID: Integration.ID },
        query: LocationQuery,
        payload: Schema.Struct({
          key: Schema.String,
          label: Schema.optional(Schema.String),
        }),
        success: HttpApiSchema.NoContent,
        error: InvalidRequestError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.connect.key",
            summary: t(language, "integration_key"),
            description: t(language, "integration_key_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("integration.connect.oauth", "/api/integration/:integrationID/connect/oauth", {
        params: { integrationID: Integration.ID },
        query: LocationQuery,
        payload: Schema.Struct({
          methodID: Integration.MethodID,
          inputs: Inputs,
          label: Schema.optional(Schema.String),
        }),
        success: Location.response(Integration.Attempt),
        error: InvalidRequestError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.connect.oauth",
            summary: t(language, "integration_oauth_begin"),
            description: t(language, "integration_oauth_begin_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("integration.attempt.status", "/api/integration/attempt/:attemptID", {
        params: { attemptID: Integration.AttemptID },
        query: LocationQuery,
        success: Location.response(Integration.AttemptStatus),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.attempt.status",
            summary: t(language, "integration_oauth_status"),
            description: t(language, "integration_oauth_status_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.post("integration.attempt.complete", "/api/integration/attempt/:attemptID/complete", {
        params: { attemptID: Integration.AttemptID },
        query: LocationQuery,
        payload: Schema.Struct({ code: Schema.optional(Schema.String) }),
        success: HttpApiSchema.NoContent,
        error: InvalidRequestError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.attempt.complete",
            summary: t(language, "integration_oauth_complete"),
            description: t(language, "integration_oauth_complete_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.delete("integration.attempt.cancel", "/api/integration/attempt/:attemptID", {
        params: { attemptID: Integration.AttemptID },
        query: LocationQuery,
        success: HttpApiSchema.NoContent,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.integration.attempt.cancel",
            summary: t(language, "integration_oauth_cancel"),
            description: t(language, "integration_oauth_cancel_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "integration_title"),
        description: t(language, "integration_description"),
      }),
    )

export const IntegrationGroup = makeIntegrationGroup()
