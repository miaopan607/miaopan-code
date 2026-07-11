import { Location } from "@miaopan-code/schema/location"
import { Reference } from "@miaopan-code/schema/reference"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { LocationQuery, locationQueryOpenApi } from "./location"
import { t, type Language } from "../i18n"

export const makeReferenceGroup = (language?: Language) =>
  HttpApiGroup.make("server.reference")
    .add(
      HttpApiEndpoint.get("reference.list", "/api/reference", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Reference.Info)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.reference.list",
            summary: t(language, "reference_list"),
            description: t(language, "reference_list_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "reference_title"),
        description: t(language, "reference_description"),
      }),
    )

export const ReferenceGroup = makeReferenceGroup()
