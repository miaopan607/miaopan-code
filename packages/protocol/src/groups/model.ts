import { Model } from "@miaopan-code/schema/model"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"
import { ServiceUnavailableError } from "../errors"
import { LocationQuery, locationQueryOpenApi } from "./location"

export const makeModelGroup = (language?: Language) =>
  HttpApiGroup.make("server.model")
    .add(
      HttpApiEndpoint.get("model.list", "/api/model", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Model.Info)),
        error: ServiceUnavailableError,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.model.list",
            summary: t(language, "model_list"),
            description: t(language, "model_list_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "model_title"),
        description: t(language, "model_description"),
      }),
    )

export const ModelGroup = makeModelGroup()
