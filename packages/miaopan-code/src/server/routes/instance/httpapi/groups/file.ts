import { FileSystem } from "@miaopan-code/core/filesystem"
import { NonNegativeInt } from "@miaopan-code/core/schema"
import { LSP } from "@/lsp/lsp"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import {
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingQuery,
  WorkspaceRoutingQueryFields,
} from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

export const FileQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  path: Schema.String,
})

export const FindTextQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  pattern: Schema.String,
})

export const FindFileQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  query: Schema.String,
  dirs: Schema.optional(Schema.Literals(["true", "false"])),
  type: Schema.optional(Schema.Literals(["file", "directory"])),
  limit: Schema.optional(
    Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(200)),
  ),
})

export const FindSymbolQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  query: Schema.String,
})

export const LegacyMatch = Schema.Struct({
  path: Schema.Struct({ text: Schema.String }),
  lines: Schema.Struct({ text: Schema.String }),
  line_number: NonNegativeInt,
  absolute_offset: NonNegativeInt,
  submatches: Schema.Array(
    Schema.Struct({
      match: Schema.Struct({ text: Schema.String }),
      start: NonNegativeInt,
      end: NonNegativeInt,
    }),
  ),
})

export const LegacyEntry = Schema.Struct({
  name: Schema.String,
  path: Schema.String,
  absolute: Schema.String,
  type: Schema.Literals(["file", "directory"]),
  ignored: Schema.Boolean,
}).annotate({ identifier: "FileNode" })

export const LegacyContent = Schema.Struct({
  type: Schema.Literals(["text", "binary"]),
  content: Schema.String,
  diff: Schema.optional(Schema.String),
  patch: Schema.optional(
    Schema.Struct({
      oldFileName: Schema.String,
      newFileName: Schema.String,
      oldHeader: Schema.optional(Schema.String),
      newHeader: Schema.optional(Schema.String),
      hunks: Schema.Array(
        Schema.Struct({
          oldStart: NonNegativeInt,
          oldLines: NonNegativeInt,
          newStart: NonNegativeInt,
          newLines: NonNegativeInt,
          lines: Schema.Array(Schema.String),
        }),
      ),
      index: Schema.optional(Schema.String),
    }),
  ),
  encoding: Schema.optional(Schema.Literal("base64")),
  mimeType: Schema.optional(Schema.String),
}).annotate({ identifier: "FileContent" })

export const LegacyStatus = Schema.Struct({
  path: Schema.String,
  added: NonNegativeInt,
  removed: NonNegativeInt,
  status: Schema.Literals(["added", "deleted", "modified"]),
}).annotate({ identifier: "File" })

export const FilePaths = {
  findText: "/find",
  findFile: "/find/file",
  findSymbol: "/find/symbol",
  list: "/file",
  content: "/file/content",
  status: "/file/status",
} as const

export const makeFileApi = (language?: Language) =>
  HttpApi.make("file")
    .add(
      HttpApiGroup.make("file")
        .add(
          HttpApiEndpoint.get("findText", FilePaths.findText, {
            query: FindTextQuery,
            success: described(Schema.Array(LegacyMatch), t(language, "response_matches")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "find.text",
              summary: t(language, "file_find_text"),
              description: t(language, "file_find_text_description"),
            }),
          ),
          HttpApiEndpoint.get("findFile", FilePaths.findFile, {
            query: FindFileQuery,
            success: described(Schema.Array(Schema.String), t(language, "response_file_paths")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "find.files",
              summary: t(language, "file_find_files"),
              description: t(language, "file_find_files_description"),
            }),
          ),
          HttpApiEndpoint.get("findSymbol", FilePaths.findSymbol, {
            query: FindSymbolQuery,
            success: described(Schema.Array(LSP.Symbol), t(language, "response_symbols")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "find.symbols",
              summary: t(language, "file_find_symbols"),
              description: t(language, "file_find_symbols_description"),
            }),
          ),
          HttpApiEndpoint.get("list", FilePaths.list, {
            query: FileQuery,
            success: described(Schema.Array(LegacyEntry), t(language, "response_files_directories")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "file.list",
              summary: t(language, "file_list"),
              description: t(language, "file_list_description"),
            }),
          ),
          HttpApiEndpoint.get("content", FilePaths.content, {
            query: FileQuery,
            success: described(LegacyContent, t(language, "response_file_content")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "file.read",
              summary: t(language, "file_read"),
              description: t(language, "file_read_description"),
            }),
          ),
          HttpApiEndpoint.get("status", FilePaths.status, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(LegacyStatus), t(language, "response_file_status")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "file.status",
              summary: t(language, "file_status"),
              description: t(language, "file_status_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "file",
            description: t(language, "file_routes"),
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

export const FileApi = makeFileApi()
