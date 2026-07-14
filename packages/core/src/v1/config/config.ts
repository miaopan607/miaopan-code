export * as ConfigV1 from "./config"

import { Schema } from "effect"
import { NonNegativeInt, PositiveInt, type DeepMutable } from "../../schema"
import { ConfigExperimental } from "../../config/experimental"
import { ConfigReference } from "../../config/reference"
import { ConfigAgentV1 } from "./agent"
import { ConfigAttachmentV1 } from "./attachment"
import { ConfigCommandV1 } from "./command"
import { ConfigFormatterV1 } from "./formatter"
import { ConfigLayoutV1 } from "./layout"
import { ConfigLSPV1 } from "./lsp"
import { ConfigMCPV1 } from "./mcp"
import { ConfigPermissionV1 } from "./permission"
import { ConfigPluginV1 } from "./plugin"
import { ConfigProviderV1 } from "./provider"
import { ConfigRetry } from "../../config/retry"
import { ConfigServerV1 } from "./server"
import { ConfigSkillsV1 } from "./skills"
import { zh } from "../../i18n"

export type Layout = ConfigLayoutV1.Layout

export const WellKnown = Schema.Struct({
  config: Schema.optional(Schema.Json),
  remote_config: Schema.optional(Schema.Json),
})

const LogLevelRef = Schema.Literals(["DEBUG", "INFO", "WARN", "ERROR"]).annotate({
  identifier: "LogLevel",
  description: zh("config.log_level"),
})

export const Info = Schema.Struct({
  $schema: Schema.optional(Schema.String).annotate({
    description: zh("config.schema"),
  }),
  language: Schema.optional(Schema.Literals(["zh-CN", "en"])).annotate({
    description: zh("config.language"),
  }),
  shell: Schema.optional(Schema.String).annotate({ description: zh("config.shell") }),
  logLevel: Schema.optional(LogLevelRef).annotate({ description: zh("config.log_level") }),
  server: Schema.optional(ConfigServerV1.Server).annotate({
    description: zh("config.v1.server"),
  }),
  command: Schema.optional(Schema.Record(Schema.String, ConfigCommandV1.Info)).annotate({
    description: zh("config.v1.command"),
  }),
  skills: Schema.optional(ConfigSkillsV1.Info).annotate({ description: zh("config.v1.skills") }),
  references: Schema.optional(ConfigReference.Info).annotate({
    description: zh("config.v1.references"),
  }),
  reference: Schema.optional(ConfigReference.Info).annotate({
    description: zh("config.v1.references_deprecated"),
  }),
  watcher: Schema.optional(Schema.Struct({ ignore: Schema.optional(Schema.mutable(Schema.Array(Schema.String))) })),
  snapshot: Schema.optional(Schema.Boolean).annotate({
    description: zh("config.v1.snapshot"),
  }),
  plugin: Schema.optional(Schema.mutable(Schema.Array(ConfigPluginV1.Spec))),
  share: Schema.optional(Schema.Literals(["manual", "auto", "disabled"])).annotate({
    description: zh("config.v1.share_behavior"),
  }),
  autoshare: Schema.optional(Schema.Boolean).annotate({
    description: zh("config.v1.share"),
  }),
  autoupdate: Schema.optional(Schema.Union([Schema.Boolean, Schema.Literal("notify")])).annotate({
    description: zh("config.v1.autoupdate"),
  }),
  disabled_providers: Schema.optional(Schema.mutable(Schema.Array(Schema.String))).annotate({
    description: zh("config.v1.disabled_providers"),
  }),
  enabled_providers: Schema.optional(Schema.mutable(Schema.Array(Schema.String))).annotate({
    description: zh("config.v1.enabled_providers"),
  }),
  model: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.model_format"),
  }),
  review_mode: Schema.optional(Schema.Literals(["codex", "opencode"])).annotate({
    description: zh("config.v1.review_mode"),
  }),
  small_model: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.small_model"),
  }),
  default_agent: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.default_agent"),
  }),
  username: Schema.optional(Schema.String).annotate({
    description: zh("config.v1.username"),
  }),
  mode: Schema.optional(
    Schema.StructWithRest(
      Schema.Struct({
        build: Schema.optional(ConfigAgentV1.Info),
        ask: Schema.optional(ConfigAgentV1.Info),
        plan: Schema.optional(ConfigAgentV1.Info),
      }),
      [Schema.Record(Schema.String, ConfigAgentV1.Info)],
    ),
  ).annotate({ description: zh("config.v1.agent_deprecated") }),
  agent: Schema.optional(
    Schema.StructWithRest(
      Schema.Struct({
        plan: Schema.optional(ConfigAgentV1.Info),
        build: Schema.optional(ConfigAgentV1.Info),
        ask: Schema.optional(ConfigAgentV1.Info),
        general: Schema.optional(ConfigAgentV1.Info),
        explore: Schema.optional(ConfigAgentV1.Info),
        title: Schema.optional(ConfigAgentV1.Info),
        summary: Schema.optional(ConfigAgentV1.Info),
        compaction: Schema.optional(ConfigAgentV1.Info),
      }),
      [Schema.Record(Schema.String, ConfigAgentV1.Info)],
    ),
  ).annotate({ description: zh("config.v1.agent") }),
  provider: Schema.optional(Schema.Record(Schema.String, ConfigProviderV1.Info)).annotate({
    description: zh("config.v1.providers"),
  }),
  mcp: Schema.optional(
    Schema.Record(Schema.String, Schema.Union([ConfigMCPV1.Info, Schema.Struct({ enabled: Schema.Boolean })])),
  ).annotate({ description: zh("config.v1.mcp") }),
  formatter: Schema.optional(ConfigFormatterV1.Info).annotate({
    description: zh("config.v1.formatter"),
  }),
  lsp: Schema.optional(ConfigLSPV1.Info).annotate({
    description: zh("config.v1.lsp"),
  }),
  instructions: Schema.optional(Schema.mutable(Schema.Array(Schema.String))).annotate({
    description: zh("config.v1.instructions"),
  }),
  question: Schema.optional(
    Schema.Struct({
      auto_resolution: Schema.optional(Schema.Boolean).annotate({
        description: zh("config.v1.question_auto_resolution"),
      }),
    }),
  ),
  layout: Schema.optional(ConfigLayoutV1.Layout).annotate({ description: zh("config.v1.layout") }),
  permission: Schema.optional(ConfigPermissionV1.Info),
  tools: Schema.optional(Schema.Record(Schema.String, Schema.Boolean)),
  attachment: Schema.optional(ConfigAttachmentV1.Info).annotate({
    description: zh("config.v1.attachments"),
  }),
  enterprise: Schema.optional(
    Schema.Struct({ url: Schema.optional(Schema.String).annotate({ description: zh("config.v1.enterprise_url") }) }),
  ),
  tool_output: Schema.optional(
    Schema.Struct({
      max_lines: Schema.optional(PositiveInt).annotate({
        description: zh("config.v1.output_lines"),
      }),
      max_bytes: Schema.optional(PositiveInt).annotate({
        description: zh("config.v1.output_bytes"),
      }),
    }),
  ).annotate({
    description: zh("config.v1.tool_output_threshold"),
  }),
  compaction: Schema.optional(
    Schema.Struct({
      auto: Schema.optional(Schema.Boolean).annotate({
        description: zh("config.v1.compaction_enabled"),
      }),
      prune: Schema.optional(Schema.Boolean).annotate({
        description: zh("config.v1.prune"),
      }),
      tail_turns: Schema.optional(NonNegativeInt).annotate({
        description: zh("config.v1.tail_turns"),
      }),
      preserve_recent_tokens: Schema.optional(NonNegativeInt).annotate({
        description: zh("config.v1.compaction_turns"),
      }),
      preserve_brief_history: Schema.optional(Schema.Boolean).annotate({
        description: zh("config.v1.preserve_brief_history"),
      }),
      reserved: Schema.optional(NonNegativeInt).annotate({
        description: zh("config.v1.compaction_buffer"),
      }),
    }),
  ),
  retry: ConfigRetry.Info.pipe(Schema.optional).annotate({
    description: zh("config.retry"),
  }),
  experimental: Schema.optional(
    Schema.Struct({
      disable_paste_summary: Schema.optional(Schema.Boolean),
      batch_tool: Schema.optional(Schema.Boolean).annotate({ description: zh("config.v1.batch_tool") }),
      openTelemetry: Schema.optional(Schema.Boolean).annotate({
        description: zh("config.v1.telemetry"),
      }),
      primary_tools: Schema.optional(Schema.mutable(Schema.Array(Schema.String))).annotate({
        description: zh("config.v1.primary_tools"),
      }),
      continue_loop_on_deny: Schema.optional(Schema.Boolean).annotate({
        description: zh("config.v1.continue_denied"),
      }),
      mcp_timeout: Schema.optional(PositiveInt).annotate({
        description: zh("config.v1.mcp_timeout"),
      }),
      policies: Schema.optional(Schema.mutable(Schema.Array(ConfigExperimental.Policy))).annotate({
        description: zh("config.v1.policy"),
      }),
    }),
  ),
}).annotate({ identifier: "Config" })

export type Info = DeepMutable<Schema.Schema.Type<typeof Info>>
