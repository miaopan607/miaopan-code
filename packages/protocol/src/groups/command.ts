import { Command } from "@miaopan-code/schema/command"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"
import { LocationQuery, locationQueryOpenApi } from "./location"

export const makeCommandGroup = (language?: Language) =>
  HttpApiGroup.make("server.command")
    .add(
      HttpApiEndpoint.get("command.list", "/api/command", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Command.Info)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.command.list",
            summary: t(language, "command_list"),
            description: t(language, "command_list_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "command_title"),
        description: t(language, "command_description"),
      }),
    )

export const CommandGroup = makeCommandGroup()
