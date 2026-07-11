import { ProviderAuth } from "@/provider/auth"
import { Provider } from "@/provider/provider"

import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"
import { ProviderV2 } from "@miaopan-code/core/provider"

const root = "/provider"

const ProviderAuthErrorName = Schema.Union([
  Schema.Literal("BadRequest"),
  Schema.Literal("ProviderAuthOauthMissing"),
  Schema.Literal("ProviderAuthOauthCodeMissing"),
  Schema.Literal("ProviderAuthOauthCallbackFailed"),
  Schema.Literal("ProviderAuthValidationFailed"),
])
export class ProviderAuthApiError extends Schema.ErrorClass<ProviderAuthApiError>("ProviderAuthError")(
  {
    name: ProviderAuthErrorName,
    data: Schema.Struct({
      providerID: Schema.optional(ProviderV2.ID),
      field: Schema.optional(Schema.String),
      message: Schema.optional(Schema.String),
      kind: Schema.optional(Schema.String),
    }),
  },
  { httpApiStatus: 400 },
) {}

export const makeProviderApi = (language?: Language) =>
  HttpApi.make("provider")
    .add(
      HttpApiGroup.make("provider")
        .add(
          HttpApiEndpoint.get("list", root, {
            query: WorkspaceRoutingQuery,
            success: described(Provider.ListResult, t(language, "response_provider_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "provider.list",
              summary: t(language, "provider_list"),
              description: t(language, "provider_list_description"),
            }),
          ),
          HttpApiEndpoint.get("auth", `${root}/auth`, {
            query: WorkspaceRoutingQuery,
            success: described(ProviderAuth.Methods, t(language, "response_provider_auth_methods")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "provider.auth",
              summary: t(language, "provider_auth_methods"),
              description: t(language, "provider_auth_methods_description"),
            }),
          ),
          HttpApiEndpoint.post("authorize", `${root}/:providerID/oauth/authorize`, {
            params: { providerID: ProviderV2.ID },
            query: WorkspaceRoutingQuery,
            payload: ProviderAuth.AuthorizeInput,
            success: described(
              Schema.UndefinedOr(ProviderAuth.Authorization),
              t(language, "response_authorization_url_method"),
            ),
            error: ProviderAuthApiError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "provider.oauth.authorize",
              summary: t(language, "provider_oauth_start"),
              description: t(language, "provider_oauth_start_description"),
            }),
          ),
          HttpApiEndpoint.post("callback", `${root}/:providerID/oauth/callback`, {
            params: { providerID: ProviderV2.ID },
            query: WorkspaceRoutingQuery,
            payload: ProviderAuth.CallbackInput,
            success: described(Schema.Boolean, t(language, "response_oauth_callback_processed")),
            error: ProviderAuthApiError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "provider.oauth.callback",
              summary: t(language, "provider_oauth_callback"),
              description: t(language, "provider_oauth_callback_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "provider",
            description: t(language, "provider_routes"),
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

export const ProviderApi = makeProviderApi()
