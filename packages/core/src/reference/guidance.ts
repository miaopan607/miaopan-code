export * as ReferenceGuidance from "./guidance"

import { makeLocationNode } from "../effect/app-node"
import { Context, Effect, Layer, Schema } from "effect"
import { Config } from "../config"
import { Reference } from "../reference"
import { SystemContext } from "../system-context/index"
import { t, type Language } from "../i18n"

const Summary = Schema.Struct({
  name: Schema.String,
  path: Schema.String,
  description: Schema.String.pipe(Schema.optional),
})

const render = (references: ReadonlyArray<typeof Summary.Type>, language: Language | undefined) =>
  [
    t(language, "prompt.reference_guidance_intro"),
    "<available_references>",
    ...references.flatMap((reference) => [
      "  <reference>",
      `    <name>${reference.name}</name>`,
      `    <path>${reference.path}</path>`,
      ...(reference.description === undefined ? [] : [`    <description>${reference.description}</description>`]),
      "  </reference>",
    ]),
    "</available_references>",
  ].join("\n")

export interface Interface {
  readonly load: () => Effect.Effect<SystemContext.SystemContext>
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/v2/ReferenceGuidance") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const config = yield* Config.Service
    const references = yield* Reference.Service
    const language = Config.latest(yield* config.entries(), "language")

    return Service.of({
      load: Effect.fn("ReferenceGuidance.load")(function* () {
        const available = (yield* references.list())
          .filter((reference) => reference.description !== undefined)
          .map((reference) => ({
            name: reference.name,
            path: reference.path,
            description: reference.description,
          }))
          .toSorted((a, b) => a.name.localeCompare(b.name))
        if (available.length === 0) return SystemContext.empty
        return SystemContext.make({
          key: SystemContext.Key.make("core/reference-guidance"),
          codec: Schema.toCodecJson(Schema.Array(Summary)),
          load: Effect.succeed(available),
          baseline: (current) => render(current, language),
          update: (_previous, current) =>
            [t(language, "prompt.reference_guidance_changed"), render(current, language)].join("\n"),
          removed: () => t(language, "prompt.reference_guidance_removed"),
        })
      }),
    })
  }),
)

export const locationLayer = layer

export const node = makeLocationNode({ service: Service, layer, deps: [Config.node, Reference.node] })
