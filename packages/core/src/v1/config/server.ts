export * as ConfigServerV1 from "./server"

import { Schema } from "effect"
import { zh } from "../../i18n"
import { PositiveInt } from "../../schema"

export const Server = Schema.Struct({
  port: Schema.optional(PositiveInt).annotate({
    description: zh("config.v1.port"),
  }),
  hostname: Schema.optional(Schema.String).annotate({ description: zh("config.v1.hostname") }),
  mdns: Schema.optional(Schema.Boolean).annotate({ description: zh("config.v1.mdns") }),
  mdnsDomain: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.mdns_domain"),
  }),
  cors: Schema.optional(Schema.mutable(Schema.Array(Schema.String))).annotate({
    description: zh("config.v1.cors"),
  }),
}).annotate({ identifier: "ServerConfig" })
export type Server = Schema.Schema.Type<typeof Server>
