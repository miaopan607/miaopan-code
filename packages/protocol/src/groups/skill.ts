import { Skill } from "@miaopan-code/schema/skill"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"
import { LocationQuery, locationQueryOpenApi } from "./location"

export const makeSkillGroup = (language?: Language) =>
  HttpApiGroup.make("server.skill")
    .add(
      HttpApiEndpoint.get("skill.list", "/api/skill", {
        query: LocationQuery,
        success: Location.response(Schema.Array(Skill.Info)),
      })
        .annotateMerge(locationQueryOpenApi)
        .annotateMerge(
          OpenApi.annotations({
            identifier: "v2.skill.list",
            summary: t(language, "skill_list"),
            description: t(language, "skill_list_description"),
          }),
        ),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "skill_title"),
        description: t(language, "skill_description"),
      }),
    )

export const SkillGroup = makeSkillGroup()
