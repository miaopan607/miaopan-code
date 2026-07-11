import { Agent } from "@miaopan-code/schema/agent"
import { Location } from "@miaopan-code/schema/location"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"
import { LocationQuery, locationQueryOpenApi } from "./location"

export const makeAgentGroup = (language?: Language) =>
  HttpApiGroup.make("server.agent").add(
    HttpApiEndpoint.get("agent.list", "/api/agent", {
      query: LocationQuery,
      success: Location.response(Schema.Array(Agent.Info)),
    })
      .annotateMerge(locationQueryOpenApi)
      .annotateMerge(
        OpenApi.annotations({
          identifier: "v2.agent.list",
          summary: t(language, "agent_list"),
          description: t(language, "agent_list_description"),
        }),
      ),
  )

export const AgentGroup = makeAgentGroup()
