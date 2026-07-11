import { Provider } from "@miaopan-code/schema/provider"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"
import { ProviderNotFoundError, ServiceUnavailableError } from "../errors"
import { LocationQuery, locationQueryOpenApi } from "./location"

export const makeProviderGroup = (language?: Language) =>
  HttpApiGroup.make("server.provider")
    .add(
      HttpApiEndpoint.get("provider.list", "/api/provider", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Provider.Info)),
        error: ServiceUnavailableError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.provider.list",
            summary: t(language, "provider_list"),
            description: t(language, "provider_list_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("provider.get", "/api/provider/:providerID", {
        params: { providerID: Provider.ID },
        query: LocationQuery,
        success: Location.response(Provider.Info),
        error: [ProviderNotFoundError, ServiceUnavailableError],
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.provider.get",
            summary: t(language, "provider_get"),
            description: t(language, "provider_get_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "provider_title"),
        description: t(language, "provider_description"),
      }),
    )

export const ProviderGroup = makeProviderGroup()
