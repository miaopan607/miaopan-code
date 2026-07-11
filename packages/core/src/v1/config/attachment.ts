export * as ConfigAttachmentV1 from "./attachment"

import { Schema } from "effect"
import { zh } from "../../i18n"
import { PositiveInt } from "../../schema"

export const Image = Schema.Struct({
  auto_resize: Schema.optional(Schema.Boolean).annotate({
    description: zh("config.v1.resize"),
  }),
  max_width: Schema.optional(PositiveInt).annotate({
    description: zh("config.v1.max_width"),
  }),
  max_height: Schema.optional(PositiveInt).annotate({
    description: zh("config.v1.max_height"),
  }),
  max_base64_bytes: Schema.optional(PositiveInt).annotate({
    description: zh("config.v1.max_bytes"),
  }),
}).annotate({ identifier: "ImageAttachmentConfig" })
export type Image = Schema.Schema.Type<typeof Image>

export const Info = Schema.Struct({
  image: Schema.optional(Image).annotate({ description: zh("config.v1.image") }),
}).annotate({ identifier: "AttachmentConfig" })
export type Info = Schema.Schema.Type<typeof Info>
