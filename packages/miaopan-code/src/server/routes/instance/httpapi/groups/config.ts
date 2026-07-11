import { Config } from "@/config/config"
import { ConfigV1 } from "@miaopan-code/core/v1/config/config"
import { Provider } from "@/provider/provider"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/config"

export const makeConfigApi = (language?: Language) =>
  HttpApi.make("config")
    .add(
      HttpApiGroup.make("config")
        .add(
          HttpApiEndpoint.get("get", root, {
            query: WorkspaceRoutingQuery,
            success: described(ConfigV1.Info, t(language, "response_config_info")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "config.get",
              summary: t(language, "config_get"),
              description: t(language, "config_get_description"),
            }),
          ),
          HttpApiEndpoint.patch("update", root, {
            query: WorkspaceRoutingQuery,
            payload: ConfigV1.Info,
            success: described(ConfigV1.Info, t(language, "response_config_updated")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "config.update",
              summary: t(language, "config_update"),
              description: t(language, "config_get_description"),
            }),
          ),
          HttpApiEndpoint.get("providers", `${root}/providers`, {
            query: WorkspaceRoutingQuery,
            success: described(Provider.ConfigProvidersResult, t(language, "response_provider_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "config.providers",
              summary: t(language, "config_providers"),
              description: t(language, "config_providers_description"),
            }),
          ),
          HttpApiEndpoint.post("refreshProviders", `${root}/providers/refresh`, {
            query: WorkspaceRoutingQuery,
            success: described(Provider.ConfigProvidersResult, t(language, "response_provider_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "config.providers.refresh",
              summary: t(language, "config_providers_refresh"),
              description: t(language, "config_providers_refresh_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "config",
            description: t(language, "config_routes"),
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

export const ConfigApi = makeConfigApi()
