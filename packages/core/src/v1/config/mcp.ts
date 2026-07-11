export * as ConfigMCPV1 from "./mcp"

import { Schema } from "effect"
import { PositiveInt } from "../../schema"
import { zh } from "../../i18n"

export const Local = Schema.Struct({
  type: Schema.Literal("local").annotate({ description: zh("config.v1.mcp_type") }),
  command: Schema.mutable(Schema.Array(Schema.String)).annotate({
    description: zh("config.v1.mcp_command"),
  }),
  cwd: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.mcp_cwd"),
  }),
  environment: Schema.optional(Schema.Record(Schema.String, Schema.String)).annotate({
    description: zh("config.v1.mcp_env"),
  }),
  enabled: Schema.optional(Schema.Boolean).annotate({
    description: zh("config.v1.mcp_enabled"),
  }),
  timeout: Schema.optional(PositiveInt).annotate({
    description: zh("config.v1.mcp_server_timeout"),
  }),
}).annotate({ identifier: "McpLocalConfig" })
export type Local = Schema.Schema.Type<typeof Local>

export const OAuth = Schema.Struct({
  clientId: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.oauth_client_id"),
  }),
  clientSecret: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.oauth_secret"),
  }),
  scope: Schema.optional(Schema.String).annotate({ description: zh("config.v1.oauth_scope") }),
  callbackPort: Schema.optional(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 65535 }))).annotate({
    description: zh("config.v1.oauth_callback"),
  }),
  redirectUri: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.oauth_redirect"),
  }),
}).annotate({ identifier: "McpOAuthConfig" })
export type OAuth = Schema.Schema.Type<typeof OAuth>

export const Remote = Schema.Struct({
  type: Schema.Literal("remote").annotate({ description: zh("config.v1.mcp_type") }),
  url: Schema.String.annotate({ description: zh("config.v1.mcp_url") }),
  enabled: Schema.optional(Schema.Boolean).annotate({
    description: zh("config.v1.mcp_enabled"),
  }),
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)).annotate({
    description: zh("config.v1.mcp_headers"),
  }),
  oauth: Schema.optional(Schema.Union([OAuth, Schema.Literal(false)])).annotate({
    description: zh("config.v1.mcp_oauth"),
  }),
  timeout: Schema.optional(PositiveInt).annotate({
    description: zh("config.v1.mcp_server_timeout"),
  }),
}).annotate({ identifier: "McpRemoteConfig" })
export type Remote = Schema.Schema.Type<typeof Remote>

export const Info = Schema.Union([Local, Remote]).annotate({ discriminator: "type" })
export type Info = Schema.Schema.Type<typeof Info>
