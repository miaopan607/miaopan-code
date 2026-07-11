import { Event } from "@miaopan-code/schema/event"
import { EventManifest } from "@miaopan-code/schema/event-manifest"
import { Location } from "@miaopan-code/schema/location"
import type { Definition } from "@miaopan-code/schema/event"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { t, type Language } from "../i18n"

const fields = {
  id: Event.ID,
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  durable: Schema.optional(Schema.Struct({ aggregateID: Schema.String, seq: Schema.Int, version: Schema.Int })),
  location: Schema.optional(Location.Ref),
}

const schema = <const Definitions extends ReadonlyArray<Definition>>(definitions: Definitions) =>
  Schema.Union([
    ...definitions,
    ...(definitions.some((definition) => definition.type === "server.connected")
      ? []
      : [
          Schema.Struct({
            ...fields,
            type: Schema.Literal("server.connected"),
            data: Schema.Struct({}),
          }).annotate({ identifier: "V2Event.server.connected" }),
        ]),
  ]).annotate({ identifier: "V2Event" })

const make = <const Definitions extends ReadonlyArray<Definition>>(definitions: Definitions, language?: Language) => {
  const EventSchema = schema(definitions)
  return {
    schema: EventSchema,
    group: HttpApiGroup.make("server.event")
      .add(
        HttpApiEndpoint.get("event.subscribe", "/api/event", {
          success: HttpApiSchema.StreamSse({ data: EventSchema }),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "v2.event.subscribe",
            summary: t(language, "event_subscribe"),
            description: t(language, "event_subscribe_description"),
          }),
        ),
      )
      .annotateMerge(
        OpenApi.annotations({ title: t(language, "event_title"), description: t(language, "event_description") }),
      ),
  }
}

export const makeEventGroup = <const Definitions extends ReadonlyArray<Definition>>(
  definitions: Definitions,
  language?: Language,
) => make(definitions, language).group

const event = make(EventManifest.ServerDefinitions)
export const EventGroup = event.group
export const MiaopanCodeEvent = event.schema
export type MiaopanCodeEvent = typeof MiaopanCodeEvent.Type
export type MiaopanCodeEventEncoded = typeof MiaopanCodeEvent.Encoded
