export * as Image from "./image"

import { makeLocationNode } from "./effect/app-node"
import { Context, Effect, Layer, Schema } from "effect"
import { Config } from "./config"
import { FileSystem } from "./filesystem"
import { zh } from "./i18n"

export class ResizerUnavailableError extends Schema.TaggedErrorClass<ResizerUnavailableError>()(
  "Image.ResizerUnavailableError",
  {},
) {}

export class DecodeError extends Schema.TaggedErrorClass<DecodeError>()("Image.DecodeError", {
  resource: Schema.String,
}) {
  override get message() {
    return zh("error.image_decode_resource", { resource: this.resource })
  }
}

export class SizeError extends Schema.TaggedErrorClass<SizeError>()("Image.SizeError", {
  resource: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
  bytes: Schema.Number,
  maxWidth: Schema.Number,
  maxHeight: Schema.Number,
  maxBytes: Schema.Number,
}) {
  override get message() {
    return zh("error.image_size_resource", {
      resource: this.resource,
      width: this.width,
      height: this.height,
      bytes: this.bytes,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      maxBytes: this.maxBytes,
    })
  }
}

export interface Interface {
  readonly normalize: (
    resource: string,
    content: FileSystem.Content & { readonly encoding: "base64" },
  ) => Effect.Effect<
    FileSystem.Content & { readonly encoding: "base64" },
    ResizerUnavailableError | DecodeError | SizeError
  >
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/Image") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const config = yield* Config.Service
    const loadAdapter = yield* Effect.cached(
      Effect.tryPromise({
        try: () => import("./image/photon"),
        catch: () => new ResizerUnavailableError(),
      }).pipe(Effect.flatMap((adapter) => adapter.make)),
    )
    const normalize = Effect.fn("Image.normalize")(function* (
      resource: string,
      content: FileSystem.Content & { readonly encoding: "base64" },
    ) {
      const image = Object.assign(
        {},
        ...(yield* config.entries()).flatMap((entry) =>
          entry.type === "document" && entry.info.attachments?.image ? [entry.info.attachments.image] : [],
        ),
      )
      const normalize = yield* loadAdapter
      return yield* normalize(resource, content, {
        autoResize: image.auto_resize ?? true,
        maxWidth: image.max_width ?? 2_000,
        maxHeight: image.max_height ?? 2_000,
        maxBase64Bytes: image.max_base64_bytes ?? 5 * 1024 * 1024,
      })
    })
    return Service.of({ normalize })
  }),
)

export const locationLayer = layer.pipe(Layer.provide(Config.locationLayer))

export const node = makeLocationNode({ service: Service, layer, deps: [Config.node] })
