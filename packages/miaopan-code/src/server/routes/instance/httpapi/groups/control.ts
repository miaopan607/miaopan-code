import { Auth } from "@/auth"

import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { described } from "./metadata"
import { ProviderV2 } from "@miaopan-code/core/provider"
import { t, type Language } from "../i18n"

const AuthParams = Schema.Struct({
  providerID: ProviderV2.ID,
})

const LogQuery = Schema.Struct({
  directory: Schema.optional(Schema.String),
  workspace: Schema.optional(Schema.String),
})

const makeLogInput = (language?: Language) =>
  Schema.Struct({
    service: Schema.String.annotate({ description: t(language, "control_service") }),
    level: Schema.Union([
      Schema.Literal("debug"),
      Schema.Literal("info"),
      Schema.Literal("error"),
      Schema.Literal("warn"),
    ]).annotate({ description: t(language, "control_log_level") }),
    message: Schema.String.annotate({ description: t(language, "control_message") }),
    extra: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)).annotate({
      description: t(language, "control_metadata"),
    }),
  })

export const LogInput = makeLogInput()

export const ControlPaths = {
  auth: "/auth/:providerID",
  log: "/log",
} as const

export const makeControlApi = (language?: Language) =>
  HttpApi.make("control").add(
    HttpApiGroup.make("control")
      .add(
        HttpApiEndpoint.put("authSet", ControlPaths.auth, {
          params: AuthParams,
          payload: Auth.Info,
          success: described(Schema.Boolean, t(language, "response_auth_credentials_set")),
          error: HttpApiError.BadRequest,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "auth.set",
            summary: t(language, "control_set_auth"),
            description: t(language, "control_set_auth"),
          }),
        ),
        HttpApiEndpoint.delete("authRemove", ControlPaths.auth, {
          params: AuthParams,
          success: described(Schema.Boolean, t(language, "response_auth_credentials_removed")),
          error: HttpApiError.BadRequest,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "auth.remove",
            summary: t(language, "control_remove_auth"),
            description: t(language, "control_remove_auth"),
          }),
        ),
        HttpApiEndpoint.post("log", ControlPaths.log, {
          query: LogQuery,
          payload: makeLogInput(language),
          success: described(Schema.Boolean, t(language, "response_log_written")),
          error: HttpApiError.BadRequest,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "app.log",
            summary: t(language, "control_write_log"),
            description: t(language, "control_write_log_description"),
          }),
        ),
      )
      .annotateMerge(OpenApi.annotations({ title: "control", description: t(language, "control_routes") })),
  )

export const ControlApi = makeControlApi()
