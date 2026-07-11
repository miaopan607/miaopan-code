import { FileSystem } from "@miaopan-code/schema/filesystem"
import { Location } from "@miaopan-code/schema/location"
import { PositiveInt, RelativePath } from "@miaopan-code/schema/schema"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { LocationQuery, locationQueryOpenApi } from "./location"
import { t, type Language } from "../i18n"

const ListQuery = Schema.Struct({
  ...LocationQuery.fields,
  path: RelativePath.pipe(Schema.optional),
})

const FindQuery = Schema.Struct({
  ...LocationQuery.fields,
  query: FileSystem.FindInput.fields.query,
  type: FileSystem.FindInput.fields.type,
  limit: Schema.NumberFromString.pipe(Schema.decodeTo(PositiveInt), Schema.optional),
})

export const makeFileSystemGroup = (language?: Language) =>
  HttpApiGroup.make("server.fs")
    .add(
      HttpApiEndpoint.get("fs.read", "/api/fs/read/*", {
        query: LocationQuery,
        success: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array()),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.fs.read",
            summary: t(language, "fs_read"),
            description: t(language, "fs_read_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("fs.list", "/api/fs/list", {
        query: ListQuery,
        success: Location.response(Schema.Array(FileSystem.Entry)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.fs.list",
            summary: t(language, "fs_list"),
            description: t(language, "fs_list_description"),
          }),
        ),
    )
    .add(
      HttpApiEndpoint.get("fs.find", "/api/fs/find", {
        query: FindQuery,
        success: Location.response(Schema.Array(FileSystem.Entry)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.fs.find",
            summary: t(language, "fs_find"),
            description: t(language, "fs_find_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "fs_title"),
        description: t(language, "fs_description"),
      }),
    )

export const FileSystemGroup = makeFileSystemGroup()
