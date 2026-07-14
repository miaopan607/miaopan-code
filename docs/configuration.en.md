# Configuration guide

Languages: [简体中文](configuration.md) · English

miaopan-code uses JSON or JSONC configuration files. This guide explains configuration locations, merge behavior, and common features. The [configuration schema](../schemas/config.json) is authoritative for field types, enums, and defaults. For TUI-only settings, see the [TUI schema](../schemas/tui.json).

## Quick start

Create `miaopan-code.jsonc` in the project root:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json",
  "language": "en",
  "model": "provider/model-id",
  "autoupdate": "notify",
}
```

`$schema` enables completion and validation in editors that support JSON Schema. `model` must include the provider prefix, for example `anthropic/claude-sonnet-4-6`.

## Configuration locations

| Scope      | Location                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project    | `./miaopan-code.json`, `./miaopan-code.jsonc`, `.miaopan-code/miaopan-code.json`, or `.miaopan-code/miaopan-code.jsonc`                           |
| Global     | `miaopan-code/miaopan-code.jsonc` or `miaopan-code.json` under the system configuration directory; the Linux default is `~/.config/miaopan-code/` |
| Additional | A file selected by `MIAOPAN_CODE_CONFIG`, or inline JSON from `MIAOPAN_CODE_CONFIG_CONTENT`                                                       |

miaopan-code searches upward from the current directory for project configuration until it reaches the worktree root. Configuration scopes are merged, with later project configuration overriding global configuration. Objects are deep-merged. Unknown top-level fields fail validation.

Most configuration is loaded at startup. Restart miaopan-code after changing configuration, agents, commands, skills, or plugin files. Changing the language with `/language` in the TUI takes effect immediately and updates global configuration.

## Common top-level fields

| Field           | Purpose                                                | Example                            |
| --------------- | ------------------------------------------------------ | ---------------------------------- |
| `language`      | Language for the UI, built-in tools, and model prompts | `"zh-CN"`, `"en"`                  |
| `model`         | Default model                                          | `"provider/model-id"`              |
| `default_agent` | Default primary agent                                  | `"build"`                          |
| `username`      | User name displayed in conversations                   | `"Alice"`                          |
| `shell`         | Default shell for terminal and shell tools             | `"/bin/zsh"`                       |
| `autoupdate`    | Automatic update policy                                | `true`, `false`, `"notify"`        |
| `share`         | Session sharing policy                                 | `"manual"`, `"auto"`, `"disabled"` |
| `instructions`  | Additional instruction files or globs                  | `["AGENTS.md", "docs/*.md"]`       |
| `formatter`     | Enable, disable, or override formatters                | `true`, `false`, or an object      |
| `lsp`           | Enable, disable, or override language servers          | `true`, `false`, or an object      |

Experimental and less common fields may change. Check the schema before using them instead of relying on an old example.

## Complete top-level field index

Every top-level field is optional. Unless stated otherwise, object fields reject child properties that are not declared by the schema.

| Field                | Type                                     | Purpose                                    |
| -------------------- | ---------------------------------------- | ------------------------------------------ |
| `$schema`            | `string`                                 | JSON Schema URL                            |
| `language`           | `"zh-CN" \| "en"`                        | Runtime language; defaults to `zh-CN`      |
| `shell`              | `string`                                 | Default shell                              |
| `logLevel`           | `"DEBUG" \| "INFO" \| "WARN" \| "ERROR"` | Log level                                  |
| `server`             | `object`                                 | Network settings for `serve` and `web`     |
| `command`            | `Record<string, Command>`                | Inline commands                            |
| `skills`             | `object`                                 | Additional skill roots and remote indexes  |
| `references`         | `Record<string, Reference>`              | Local directory or Git references          |
| `reference`          | `Record<string, Reference>`              | Deprecated; use `references`               |
| `watcher`            | `object`                                 | File-watcher ignore rules                  |
| `snapshot`           | `boolean`                                | Filesystem snapshot tracking               |
| `plugin`             | `Array<string \| [string, object]>`      | Plugins                                    |
| `share`              | `"manual" \| "auto" \| "disabled"`       | Sharing policy                             |
| `autoshare`          | `boolean`                                | Automatically share new sessions           |
| `autoupdate`         | `boolean \| "notify"`                    | Update policy                              |
| `disabled_providers` | `string[]`                               | Disabled providers                         |
| `enabled_providers`  | `string[]`                               | Exclusive provider allowlist               |
| `model`              | `string`                                 | Default model in `provider/model` format   |
| `review_mode`        | `"codex" \| "opencode"`                  | Backend for `/review`; defaults to `codex` |
| `small_model`        | `string`                                 | Model for titles and other small tasks     |
| `default_agent`      | `string`                                 | Default primary agent                      |
| `username`           | `string`                                 | Displayed user name                        |
| `mode`               | `Record<string, Agent>`                  | Deprecated; use `agent`                    |
| `agent`              | `Record<string, Agent>`                  | Agent definitions and built-in overrides   |
| `provider`           | `Record<string, Provider>`               | Provider and model overrides               |
| `mcp`                | `Record<string, MCP>`                    | MCP servers                                |
| `formatter`          | `boolean \| Record<string, Formatter>`   | Formatters                                 |
| `lsp`                | `boolean \| Record<string, LSP>`         | Language servers                           |
| `instructions`       | `string[]`                               | Additional instruction files or globs      |
| `question`           | `object`                                 | Question-tool behavior                     |
| `layout`             | `"auto" \| "stretch"`                    | Deprecated; runtime always uses `stretch`  |
| `permission`         | `Permission`                             | Global tool permissions                    |
| `tools`              | `Record<string, boolean>`                | Tool enablement map                        |
| `attachment`         | `object`                                 | Attachment and image limits                |
| `enterprise`         | `object`                                 | Enterprise service URL                     |
| `tool_output`        | `object`                                 | Tool-output truncation limits              |
| `compaction`         | `object`                                 | Context compaction policy                  |
| `experimental`       | `object`                                 | Experimental features                      |

## Server, watcher, and sharing

`server` supports `port`, `hostname`, `mdns`, `mdnsDomain`, and `cors`. `port` must be positive and `cors` is an array of additional allowed origins. `watcher.ignore` contains file-watcher globs. `snapshot` controls filesystem snapshots, `share` selects the sharing mode, and `autoshare` automatically shares new sessions.

## Providers and models

`model` uses the `provider/model-id` format. Provider credentials and custom options belong under `provider`:

```jsonc
{
  "model": "anthropic/claude-sonnet-4-6",
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}",
      },
    },
  },
  "disabled_providers": ["openai"],
}
```

You can also run `/connect` in the TUI or configure a provider through the CLI. Prefer environment variables or the authentication store for credentials, and do not commit secrets to the repository.

### Provider and model fields

A provider entry supports `api`, `name`, `env`, `id`, `npm`, `whitelist`, `blacklist`, `options`, and `models`. `options` supports `apiKey`, `baseURL`, `enterpriseUrl`, `setCacheKey`, `timeout`, `headerTimeout`, and `chunkTimeout`. Timeouts are milliseconds; `timeout` and `headerTimeout` may be `false`.

`provider.<id>.models.<model>` supports:

| Field                                                 | Type and purpose                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `id`, `name`, `family`, `release_date`                | String metadata                                                                            |
| `compaction_model`                                    | Compaction model in `provider/model` format                                                |
| `attachment`, `reasoning`, `temperature`, `tool_call` | Boolean capability flags                                                                   |
| `interleaved`                                         | `true` or `{ field }`; `field` is `reasoning`, `reasoning_content`, or `reasoning_details` |
| `cost`                                                | Requires `input` and `output`; may include cache prices and `context_over_200k`            |
| `limit`                                               | Requires `context` and `output`; `input` is optional                                       |
| `modalities`                                          | `input` and `output` arrays containing `text`, `audio`, `image`, `video`, or `pdf`         |
| `experimental`                                        | Marks an experimental model                                                                |
| `status`                                              | `alpha`, `beta`, `deprecated`, or `active`                                                 |
| `provider`                                            | Model-level `{ npm?, api? }` override                                                      |
| `options`                                             | Model request options                                                                      |
| `headers`                                             | Model-specific request headers                                                             |
| `variants.<name>.disabled`                            | Disables a variant                                                                         |

## Agents

Simple agents can be defined inline:

```jsonc
{
  "agent": {
    "reviewer": {
      "description": "Review code quality and potential defects.",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-6",
      "permission": {
        "edit": "deny",
        "bash": "ask",
      },
      "prompt": "Focus on correctness, maintainability, and test coverage.",
    },
  },
}
```

For complex agents, use `.miaopan-code/agent/<name>.md` or `.miaopan-code/agents/<name>.md`:

```markdown
---
description: Review code quality and potential defects.
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
  bash: ask
---

Focus on correctness, maintainability, and test coverage.
```

The file body becomes the agent prompt; do not also add `prompt` to the frontmatter. `mode` can be `primary`, `subagent`, or `all`. Use `agent: { build: { disable: true } }` to disable a built-in agent with the same name.

The complete agent field set is `model: string`, `variant: string`, `temperature: number`, `top_p: number`, `prompt: string`, `disable: boolean`, `description: string`, `mode: "subagent" | "primary" | "all"`, `hidden: boolean`, `options: object`, `color`, `steps: positive integer`, and `permission`. `color` accepts a six-digit hex color or `primary`, `secondary`, `accent`, `success`, `warning`, `error`, or `info`. `tools` and `maxSteps` are deprecated compatibility fields.

## Skills and commands

A skill file must be named `SKILL.md` and live in its own directory:

```text
.miaopan-code/skills/my-skill/SKILL.md
```

```markdown
---
name: my-skill
description: Explain what the skill does and when it should be used.
---

# Skill instructions

Add instructions, examples, and references here.
```

Use `skills.paths` to add local skill roots and `skills.urls` to add remote skill indexes:

```jsonc
{
  "skills": {
    "paths": [".miaopan-code/skills", "/absolute/path/to/skills"],
    "urls": ["https://example.com/.well-known/skills/"],
  },
}
```

Custom commands live in `.miaopan-code/command/<name>.md` or `.miaopan-code/commands/<name>.md`. The file body is the command template and supports `$ARGUMENTS` and positional arguments such as `$1` and `$2`.

Inline `command.<name>` requires `template: string` and supports `description: string`, `agent: string`, `model: string`, `variant: string`, and `subtask: boolean`.

## External references

`references` adds local directories or Git repositories outside the project to the available context:

```jsonc
{
  "references": {
    "docs": {
      "path": "../product-docs",
      "description": "Product behavior and terminology",
    },
    "effect": {
      "repository": "Effect-TS/effect",
      "branch": "main",
      "description": "Effect implementation reference",
    },
  },
}
```

Aliases appear in completion as `@docs`. Only references with a `description` are proactively announced to agents. `hidden: true` hides TUI completion but does not prevent direct access.

## Plugins

`plugin` is an array whose entries can be npm specs, local files, or tuples with options:

```jsonc
{
  "plugin": [
    "miaopan-code-gemini-auth",
    "miaopan-code-example@1.2.3",
    "./local-plugin.ts",
    ["miaopan-code-example", { "feature": true }],
  ],
}
```

Files ending in `*.ts` or `*.js` under `.miaopan-code/plugin/` and `.miaopan-code/plugins/` are discovered automatically and do not need a `plugin` entry.

## MCP servers

Local MCP servers use an array of strings for `command`:

```jsonc
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true,
      "environment": {
        "BROWSER": "chromium",
      },
    },
    "github": {
      "type": "remote",
      "url": "https://example.com/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {env:GITHUB_TOKEN}",
      },
    },
  },
}
```

String values support `{env:VAR}` and `{file:path}` interpolation. Use `enabled: false` to disable a server inherited from a lower-precedence configuration.

Local MCP entries require `type` and `command`, and support `cwd`, `environment`, `enabled`, and `timeout`. Remote entries require `type` and `url`, and support `headers`, `enabled`, `timeout`, and `oauth`. `timeout` is a positive millisecond value and defaults to 5000. `oauth` may be `false` or an object containing `clientId`, `clientSecret`, `scope`, `callbackPort`, and `redirectUri`; callback ports range from 1 to 65535.

## Permissions

Permission actions are `allow`, `ask`, and `deny`:

```jsonc
{
  "permission": {
    "edit": "ask",
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "rm *": "deny",
    },
    "external_directory": {
      "*": "allow",
      "~/secrets/**": "deny",
    },
  },
}
```

Pattern rules use the last matching entry, so place broad rules before more specific rules. Agent-level `permission` overrides top-level permissions. Top-level `permission: "allow"` permits every operation and is usually not recommended.

## Formatters and language servers

Set `formatter` or `lsp` to `true` to enable built-in registrations, `false` to disable all registrations, or use an object to override and add entries.

- Formatter entries support `disabled: boolean`, `command: string[]`, `environment: Record<string, string>`, and `extensions: string[]`.
- Custom LSP entries require `command: string[]` and support `extensions: string[]`, `env: Record<string, string>`, `initialization: object`, and `disabled: boolean`.
- To disable an existing LSP, use `{ "disabled": true }`.

## Attachments, output, questions, and compaction

| Path                                | Type                 | Default or purpose                                            |
| ----------------------------------- | -------------------- | ------------------------------------------------------------- |
| `attachment.image.auto_resize`      | `boolean`            | Defaults to `true`; resize oversized images before sending    |
| `attachment.image.max_width`        | positive integer     | Defaults to `2000`                                            |
| `attachment.image.max_height`       | positive integer     | Defaults to `2000`                                            |
| `attachment.image.max_base64_bytes` | positive integer     | Defaults to `5242880`                                         |
| `tool_output.max_lines`             | positive integer     | Defaults to `2000`; truncate the preview and save full output |
| `tool_output.max_bytes`             | positive integer     | Defaults to `51200`; whichever limit is reached first applies |
| `question.auto_resolution`          | `boolean`            | Defaults to `true`; allow an empty answer after the wait      |
| `compaction.auto`                   | `boolean`            | Defaults to `true`; compact near the context limit            |
| `compaction.prune`                  | `boolean`            | Defaults to `false`; prune old tool output                    |
| `compaction.tail_turns`             | non-negative integer | Defaults to `2`; recent user turns retained verbatim          |
| `compaction.preserve_recent_tokens` | non-negative integer | Maximum recent tokens retained verbatim                       |
| `compaction.preserve_brief_history` | `boolean`            | Defaults to `false`; retain concise per-turn history          |
| `compaction.reserved`               | non-negative integer | Context window reserved for output and compaction             |

## Other and experimental fields

- `instructions`: array of additional instruction paths or globs.
- `tools`: boolean enablement map keyed by tool ID.
- `enterprise.url`: enterprise service endpoint.
- `experimental.disable_paste_summary`: disable pasted-content summaries.
- `experimental.batch_tool`: enable the batch tool.
- `experimental.openTelemetry`: enable OpenTelemetry spans for AI SDK calls.
- `experimental.primary_tools`: tool IDs available only to primary agents.
- `experimental.continue_loop_on_deny`: continue the agent loop after a denied tool call.
- `experimental.mcp_timeout`: positive millisecond value.
- `experimental.policies`: policy array; each entry requires `action: "provider.use"`, `effect: "allow" | "deny"`, and `resource: string`.

Experimental fields do not carry compatibility guarantees.

## Deprecated fields

- `reference`: use `references`.
- `mode`: use `agent`.
- `layout`: no longer changes layout; runtime always uses `stretch`.
- `agent.<name>.tools`: retained for compatibility; prefer current permission and tool configuration.
- `agent.<name>.maxSteps`: use `steps`.

## TUI configuration

Themes, keybindings, and TUI plugins use a separate `tui.json` or `tui.jsonc`. Place it in the global configuration directory or a project `.miaopan-code/` directory; project files are also discovered by walking upward.

| Field                 | Type                                | Purpose                                                    |
| --------------------- | ----------------------------------- | ---------------------------------------------------------- |
| `$schema`             | `string`                            | [TUI schema](../schemas/tui.json) URL                      |
| `theme`               | `string`                            | Theme ID                                                   |
| `keybinds`            | `object`                            | Keybinding overrides; the TUI schema lists every action ID |
| `plugin`              | `Array<string \| [string, object]>` | TUI plugins                                                |
| `plugin_enabled`      | `Record<string, boolean>`           | Enable or disable plugins by ID                            |
| `leader_timeout`      | `integer`                           | Leader-key timeout in milliseconds                         |
| `attention`           | `object`                            | Notifications and sounds                                   |
| `prompt`              | `object`                            | Prompt dimensions                                          |
| `scroll_speed`        | `number`                            | Scroll speed                                               |
| `scroll_acceleration` | `{ enabled: boolean }`              | Scroll acceleration                                        |
| `diff_style`          | `"auto" \| "stacked"`               | Diff layout                                                |
| `tool_display`        | `"compact" \| "detailed"`           | Tool-call display style                                    |
| `mouse`               | `boolean`                           | Mouse capture; defaults to `true`                          |

`attention` supports `enabled`, `notifications`, `sound`, `volume`, `sound_pack`, plus `sounds.default`, `question`, `permission`, `error`, `done`, and `subagent_done`. `prompt.max_height` is the maximum input height; `prompt.max_width` is a positive integer or `"auto"`.

Each `keybinds.<action>` accepts a key string, a key descriptor object, an array of those values, or `false`/`"none"` to disable it. Actions cover application, command, diff, session, model, agent, message, input, dialog, plugin, and terminal operations. The exact IDs are the properties under `keybinds` in the [TUI schema](../schemas/tui.json); editors complete every action when `$schema` is present.

## Codex request version

Codex model requests emulate `codex-tui` with version `0.144.1` by default. Set `MIAOPAN_CODE_CODEX_VERSION` to override that version; it appears in both the User-Agent prefix and the trailing client information. Restart miaopan-code after changing it.

## Recovering from invalid configuration

If invalid configuration prevents miaopan-code from starting, temporarily use one of these environment variables:

- `MIAOPAN_CODE_DISABLE_PROJECT_CONFIG=1`: skip project configuration and load only global configuration.
- `MIAOPAN_CODE_CONFIG=/path/to/file.json`: load an additional explicit configuration file.
- `MIAOPAN_CODE_CONFIG_CONTENT='{...}'`: merge inline JSON as the final configuration source.
- `MIAOPAN_CODE_DISABLE_DEFAULT_PLUGINS=1`: skip default plugins.
- `MIAOPAN_CODE_PURE=1`: skip all external plugins.
- `MIAOPAN_CODE_DISABLE_EXTERNAL_SKILLS=1`: skip external skill discovery.

Remove the temporary environment variable and restart after fixing the file.

## Validation checklist

1. Keep `$schema` in every configuration file.
2. Use editor completion and validation provided by the schema.
3. Check the [configuration schema](../schemas/config.json) for the installed version before editing uncommon fields.
4. Do not commit API keys, tokens, or other secrets.
5. Restart miaopan-code after changing startup-time configuration files.
