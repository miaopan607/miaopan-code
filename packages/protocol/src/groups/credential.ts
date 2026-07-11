import { Credential } from "@miaopan-code/schema/credential"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { LocationQuery, locationQueryOpenApi } from "./location"
import { t, type Language } from "../i18n"

export const makeCredentialGroup = (language?: Language) =>
  HttpApiGroup.make("server.credential")
    .add(
      HttpApiEndpoint.patch("credential.update", "/api/credential/:credentialID", {
        params: { credentialID: Credential.ID },
        query: LocationQuery,
        payload: Schema.Struct({ label: Schema.String }),
        success: HttpApiSchema.NoContent,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.credential.update",
            summary: t(language, "credential_update"),
            description: t(language, "credential_update_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.delete("credential.remove", "/api/credential/:credentialID", {
        params: { credentialID: Credential.ID },
        query: LocationQuery,
        success: HttpApiSchema.NoContent,
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.credential.remove",
            summary: t(language, "credential_remove"),
            description: t(language, "credential_remove_description"),
          }),
        ),
    )

export const CredentialGroup = makeCredentialGroup()
