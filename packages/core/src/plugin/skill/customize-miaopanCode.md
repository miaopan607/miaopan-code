<!--
  内置技能。名称和描述在以下代码中注册：
  packages/core/src/plugin/skill.ts
  以及 CUSTOMIZE_MIAOPAN_CODE_SKILL_DESCRIPTION）。下方正文将成为
  该技能的内容。
-->

# 自定义 miaopan-code

语言：简体中文（应用界面默认使用简体中文；如需英文，请配置 `language: "en"`）

miaopan-code 会严格校验自身配置，并在字段错误时拒绝启动。下方结构
覆盖常见范围，但它们只是
**摘要，而非事实来源**。

## 完整 Schema 参考

每个配置选项的权威列表——包括字段类型、枚举、
默认值和描述——位于已发布的 JSON Schema 中：

**<https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json>**

TUI Schema：**<https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/tui.json>**

如果本技能没有记录某个字段，或者你需要在写入配置前确认确切
结构，**请获取该 URL 并直接阅读 Schema**，
不要猜测。miaopan-code 会在配置无效时直接失败，因此错误结构的
代价是启动失败。

此外，每个 `miaopan-code.json` 都应声明
`"$schema": "https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json"`，以便用户的编辑器在
输入时捕获错误。

## 应用更改

配置在 miaopan-code 启动时加载一次，不会热重载。保存
`miaopan-code.json`、代理文件、技能、插件或任何
其他配置期文件的更改后，**告诉用户退出并重新启动 miaopan-code**，
更改才会生效。在此之前，正在运行的会话会继续使用
已经加载的配置。

## 文件位置

| 范围                 | 路径                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 项目配置             | `./miaopan-code.json`、`./miaopan-code.jsonc` 或 `.miaopan-code/miaopan-code.json`（miaopan-code 从 cwd 向上查找到 worktree 根目录） |
| 全局配置             | `~/.config/miaopan-code/miaopan-code.json`（不是 `~/.miaopan-code/`）                                                                |
| 项目代理             | `.miaopan-code/agent/<name>.md` 或 `.miaopan-code/agents/<name>.md`                                                                  |
| 全局代理             | `~/.config/miaopan-code/agent(s)/<name>.md`                                                                                          |
| 项目命令             | `.miaopan-code/command/<name>.md` 或 `.miaopan-code/commands/<name>.md`                                                              |
| 全局命令             | `~/.config/miaopan-code/command(s)/<name>.md`                                                                                        |
| 项目技能             | `.miaopan-code/skill(s)/<name>/SKILL.md`                                                                                             |
| 全局技能             | `~/.config/miaopan-code/skill(s)/<name>/SKILL.md`                                                                                    |
| 外部技能（自动加载） | `~/.claude/skills/<name>/SKILL.md`、`~/.agents/skills/<name>/SKILL.md`                                                               |

各范围的配置会深度合并。项目配置覆盖全局配置。`miaopan-code.json`
中未知的顶层 key 会被拒绝，并产生 `ConfigInvalidError`。

## miaopan-code.json

每个字段都是可选的。

```json
{
  "$schema": "https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json",
  "username": "string",
  "model": "provider/model-id",
  "small_model": "provider/model-id",
  "default_agent": "agent-name",
  "shell": "/bin/zsh",
  "logLevel": "DEBUG" | "INFO" | "WARN" | "ERROR",
  "share": "manual" | "auto" | "disabled",
  "autoupdate": true | false | "notify",
  "snapshot": true,
  "instructions": ["AGENTS.md", "docs/style.md"],

  "skills": {
    "paths": [".miaopan-code/skills", "/abs/path/to/skills"],
    "urls": ["https://example.com/.well-known/skills/"]
  },

  "references": {
    "docs": {
      "path": "../docs",
      "description": "用于产品行为和文档约定"
    },
    "sdk": {
      "repository": "owner/sdk",
      "branch": "main",
      "description": "用于 SDK 实现细节",
      "hidden": true
    }
  },

  "agent": {
    "my-agent": {
      "model": "anthropic/claude-sonnet-4-6",
      "mode": "subagent",
      "description": "...",
      "permission": { "edit": "deny" }
    }
  },

  "command": {
    "deploy": { "description": "...", "template": "..." }
  },

  "provider": {
    "anthropic": { "options": { "apiKey": "..." } }
  },
  "disabled_providers": ["openai"],
  "enabled_providers": ["anthropic"],

  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true,
      "environment": {}
    },
    "remote-thing": {
      "type": "remote",
      "url": "https://...",
      "headers": { "Authorization": "Bearer ..." }
    }
  },

  "plugin": [
    "miaopan-code-gemini-auth",
    "miaopan-code-foo@1.2.3",
    "./local-plugin.ts",
    ["miaopan-code-bar", { "option": "value" }]
  ],

  "permission": {
    "edit": "deny",
    "bash": { "git *": "allow", "*": "ask" }
  },

  "formatter": false,
  "lsp": false,

  "question": { "auto_resolution": false },

  "experimental": {
    "primary_tools": ["edit"],
    "mcp_timeout": 30000
  },

  "tool_output": { "max_lines": 200, "max_bytes": 8192 },

  "compaction": { "auto": true, "tail_turns": 15 }
}
```

需要明确说明的结构注意事项：

- `model` 始终包含提供商前缀：`"anthropic/claude-sonnet-4-6"`。
- `skills` 是包含 `paths` 和/或 `urls` 的对象，而不是数组。
- `references` 是以别名为 key 的对象。每个值是本地路径、Git 仓库或字符串简写。
- `agent` 是以代理名称为 key 的对象，而不是数组。
- `command` 是以命令名称为 key 的对象，而不是数组。
- `plugin` 是字符串或 `[name, options]` 元组组成的数组，而不是对象。
- `mcp[name].command` 是字符串数组，绝不是单个字符串。`type` 是必填项。
- `permission` 可以是字符串操作，也可以是以工具名称为 key 的对象。
- `question.auto_resolution` 默认为 `true`。设为 `false` 后，提问将一直等待用户回答，模型也不会看到自动处理参数。

## 完整字段覆盖

修改配置前必须读取当前 Schema。不得因为本摘要没有列出某字段就删除它，也不得根据相似名称猜测结构。

主配置的全部顶层字段为：`$schema`、`language`、`shell`、`logLevel`、`server`、`command`、`skills`、`references`、`reference`、`watcher`、`snapshot`、`plugin`、`share`、`autoshare`、`autoupdate`、`disabled_providers`、`enabled_providers`、`model`、`review_mode`、`small_model`、`default_agent`、`username`、`mode`、`agent`、`provider`、`mcp`、`formatter`、`lsp`、`instructions`、`question`、`layout`、`permission`、`tools`、`attachment`、`enterprise`、`tool_output`、`compaction`、`experimental`。

关键嵌套字段：

- `server`：`port`、`hostname`、`mdns`、`mdnsDomain`、`cors`。
- `command.<name>`：必填 `template`；可选 `description`、`agent`、`model`、`variant`、`subtask`。
- `references.<name>`：字符串，或 `{ path, description?, hidden? }`，或 `{ repository, branch?, description?, hidden? }`。
- `agent.<name>`：`model`、`variant`、`temperature`、`top_p`、`prompt`、`disable`、`description`、`mode`、`hidden`、`options`、`color`、`steps`、`permission`。
- `provider.<id>`：`api`、`name`、`env`、`id`、`npm`、`whitelist`、`blacklist`、`options`、`models`。
- `provider.<id>.options`：`apiKey`、`baseURL`、`enterpriseUrl`、`setCacheKey`、`timeout`、`headerTimeout`、`chunkTimeout`。
- `provider.<id>.models.<model>`：`id`、`compaction_model`、`name`、`family`、`release_date`、`attachment`、`reasoning`、`temperature`、`tool_call`、`interleaved`、`cost`、`limit`、`modalities`、`experimental`、`status`、`provider`、`options`、`headers`、`variants`。
- 本地 `mcp`：必填 `type: "local"`、`command`；可选 `cwd`、`environment`、`enabled`、`timeout`。
- 远程 `mcp`：必填 `type: "remote"`、`url`；可选 `enabled`、`headers`、`oauth`、`timeout`。OAuth 支持 `clientId`、`clientSecret`、`scope`、`callbackPort`、`redirectUri`。
- `formatter.<name>`：`disabled`、`command`、`environment`、`extensions`。
- 自定义 `lsp.<name>`：必填 `command`；可选 `extensions`、`disabled`、`env`、`initialization`。
- `attachment.image`：`auto_resize`、`max_width`、`max_height`、`max_base64_bytes`。
- `tool_output`：`max_lines`、`max_bytes`。
- `compaction`：`auto`、`prune`、`tail_turns`、`preserve_recent_tokens`、`preserve_brief_history`、`reserved`。
- `experimental`：`disable_paste_summary`、`batch_tool`、`openTelemetry`、`primary_tools`、`continue_loop_on_deny`、`mcp_timeout`、`policies`。

弃用项：`reference` 改用 `references`；`mode` 改用 `agent`；`layout` 已不再改变布局；Agent 的 `maxSteps` 改用 `steps`。

## 技能

miaopan-code 的技能加载器会在技能目录中扫描 `**/SKILL.md`。该
文件必须准确命名为 `SKILL.md`，并放在以技能命名的独立
文件夹中：

```
.miaopan-code/skills/my-skill/SKILL.md
```

Frontmatter：

```markdown
---
name: my-skill
description: 用一句话说明该技能做什么以及何时触发。将用户可能提到的字面关键词或文件名放在开头。
---

# 我的技能

（Markdown 格式的技能正文：指令、示例、参考资料）
```

- `name` 是必填项，使用小写字母和连字符，最多 64 个字符，并与文件夹名称一致。
- `description` 实际上是必填项：没有描述的技能会被过滤掉，永远不会提供给模型。同时涵盖技能做*什么*以及*何时*使用。使用第三人称（“Use when...”，而不是“I help with...”）。将具体触发关键词和文件名放在开头；如果该技能在相邻主题中应保持安静，则使用“Use ONLY when...”进行限制。
- 可选字段：`license`、`compatibility`、`metadata`（字符串到字符串的映射）。

通过 `skills.paths` 注册非默认位置中的技能（递归扫描
`**/SKILL.md`），也可通过 `skills.urls` 注册（每个 URL 提供一个
技能列表）。

## 引用

引用让活动项目之外的本地目录和 Git 仓库可以作为
辅助上下文使用。请在 `references` 下配置，并以
`@` 自动补全中使用的别名作为 key：

```json
{
  "references": {
    "docs": {
      "path": "../product-docs",
      "description": "用于产品行为和术语"
    },
    "effect": {
      "repository": "Effect-TS/effect",
      "branch": "main",
      "description": "用于 Effect 实现细节"
    }
  }
}
```

本地 `path` 值可以相对于声明它的配置，也可以是绝对路径，或者使用
`~/`。Git `repository` 值接受 Git URL、host/path 引用和 GitHub
`owner/repo` 简写；`branch` 是可选的。两种形式都支持可选的
`description` 和 `hidden` 字段。

- 只有包含 `description` 的引用才会在系统上下文中向代理公布。
- `hidden: true` 只会从 TUI 的 `@` 自动补全中移除引用。代理和直接路径仍可使用它。
- 引用目录会自动通过外部目录边界；常规的读取、编辑和工具权限仍然适用。
- 支持字符串简写：本地路径可使用 `"docs": "../docs"`，Git 仓库可使用 `"effect": "Effect-TS/effect"`。

## 代理

定义代理有两种方式。任何非简单配置都应使用文件形式。

### 内联（在 `miaopan-code.json` 中）

```json
{
  "agent": {
    "my-reviewer": {
      "description": "审查 PR 中的风格违规。",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-6",
      "permission": { "edit": "deny", "bash": "ask" },
      "prompt": "你是一名严格的 PR 审查者……"
    }
  }
}
```

### 文件

```
.miaopan-code/agent/my-reviewer.md      或     .miaopan-code/agents/my-reviewer.md
```

```markdown
---
description: 审查 PR 中的风格违规。
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
  bash: ask
---

你是一名严格的 PR 审查者。重点关注……
```

文件正文会成为代理的 `prompt`。不要同时在
frontmatter 中加入 `prompt:`。

`mode` 是 `"primary"`、`"subagent"`、`"all"` 之一。

允许的顶层 frontmatter 字段：`name, model, variant, description, mode,
hidden, color, steps, options, permission, disable, temperature, top_p`。所有
未知字段都会被静默传入 `options`。

要禁用内置代理：使用 `agent: { build: { disable: true } }`；或者在
文件 frontmatter 中设置 `disable: true`。

`default_agent` 必须指向非隐藏的 primary 模式代理。

### 内置代理

miaopan-code 随附 `build`、`ask`、`plan`、`general`、`explore`。其中 `ask` 保留
`build` 的问答能力，但禁止修改工作区；`plan` 用于制定可实施方案。隐藏的内部代理包括：
`compaction`、`title`、`summary`。要覆盖内置代理的字段，请在
`agent: { <name>: { ... } }` 中定义相同的 key。

## 命令

miaopan-code 的命令加载器会扫描命令目录中的 `**/*.md`。该
文件以命令命名，直接位于 `command` 文件夹中：

```
.miaopan-code/command/deploy.md
```

Frontmatter：

```markdown
---
description: 用一句话描述命令的作用。
agent: build
model: anthropic/claude-sonnet-4-6
---

（Markdown 格式的命令正文：miaopan-code 运行的提示词，使用 $ARGUMENTS 表示用户输入）
```

- `template` 是命令正文——即 frontmatter 下方的所有内容——而且是必填项：它是调用命令时 miaopan-code 运行的提示词。不要同时在 frontmatter 中放置 `template:` key。
- `$ARGUMENTS` 会被替换为用户在命令后输入的全部内容；`$1`、`$2`……提取各个位置参数。
- 可选字段：`description`、`agent`、`model`、`variant`、`subtask`。

## 插件

`plugin:` 是一个数组。每个条目是以下形式之一：

```json
"plugin": [
  "miaopan-code-gemini-auth",            // npm spec，最新版
  "miaopan-code-foo@1.2.3",              // npm spec，固定版本
  "./local-plugin.ts",               // 文件路径，相对于声明它的配置
  "file:///abs/path/plugin.js",      // 文件 URL
  ["miaopan-code-bar", { "key": "val" }] // 带选项的元组形式
]
```

自动发现的插件（无需配置条目）：`.miaopan-code/plugin/` 或
`.miaopan-code/plugins/` 中的任何 `*.ts` 或 `*.js` 文件。

插件模块导出类型为
`Plugin = (input: PluginInput, options?) => Promise<Hooks>` 的 `default`（或任意具名导出）。导出值是
函数，而不是普通对象字面量，并且该函数返回一个对象
（如果没有要注册的内容，则返回 `{}`）。

```ts
import type { Plugin } from "@miaopan/plugin"

export default (async ({ client, project, directory, $ }) => {
  return {
    config: (cfg) => {
      // cfg 是实时合并后的配置；在这里修改字段。
    },
    "tool.execute.before": async (input, output) => {
      // 在工具运行前修改 output.args
    },
  }
}) satisfies Plugin
```

Hook 范围（就地修改 `output`；返回 `void`）：

- `event(input)`：每个总线事件
- `config(cfg)`：初始化时使用合并后的配置调用一次
- `chat.message`、`chat.params`、`chat.headers`
- `tool.execute.before`、`tool.execute.after`
- `tool.definition`
- `command.execute.before`
- `shell.env`
- `permission.ask`
- `experimental.chat.messages.transform`、`experimental.chat.system.transform`、
  `experimental.session.compacting`、`experimental.compaction.autocontinue`、
  `experimental.text.complete`

特殊的对象形式（不是回调）：`tool: { my_tool: { ... } }`、
`auth: { ... }`、`provider: { ... }`。

## MCP 服务器

`mcp:` 是以服务器名称为 key 的对象。每个服务器由
`type` 区分：

```json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true,
      "environment": { "BROWSER": "chromium" }
    },
    "github": {
      "type": "remote",
      "url": "https://...",
      "enabled": true,
      "headers": { "Authorization": "Bearer {env:GITHUB_TOKEN}" }
    },
    "old-server": { "enabled": false }
  }
}
```

`command` 是字符串数组。`type` 是必填项。使用 `enabled: false`
禁用从父配置继承的服务器。Header token 等字符串值
支持 `{env:VAR}` 插值（以及 `{file:path}`）；Shell 风格的
`${VAR}` 不会被替换。

## TUI 配置

TUI 使用单独的 `tui.json` 或 `tui.jsonc`。写入时必须读取 TUI Schema，不要把 TUI 字段写进 `miaopan-code.json`。

全部顶层字段为：`$schema`、`theme`、`keybinds`、`plugin`、`plugin_enabled`、`leader_timeout`、`attention`、`prompt`、`scroll_speed`、`scroll_acceleration`、`diff_style`、`tool_display`、`mouse`。

- `attention`：`enabled`、`notifications`、`sound`、`volume`、`sound_pack`，以及 `sounds.default`、`question`、`permission`、`error`、`done`、`subagent_done`。
- `prompt`：`max_height`、`max_width`；`max_width` 是正整数或 `"auto"`。
- `scroll_acceleration`：`enabled`。
- `diff_style`：`"auto"` 或 `"stacked"`；`tool_display`：`"compact"` 或 `"detailed"`。
- `keybinds.<action>` 接受按键字符串、按键描述对象、这些值的数组，或 `false`/`"none"`。动作 ID 必须从 TUI Schema 的 `keybinds.properties` 读取，不得自行发明。

## 权限

```json
"permission": {
  "edit": "deny",
  "bash": { "git *": "allow", "rm *": "deny", "*": "ask" },
  "external_directory": { "~/secrets/**": "deny", "*": "allow" }
}
```

操作：`"allow"`、`"ask"`、`"deny"`。

每个工具的值有两种形式：`"allow"` 简写（视为 `{"*": "allow"}`），或者
对象 `{ pattern: action }`。在对象中，**插入顺序很重要**。
miaopan-code 会采用最后一条匹配规则，因此应先放宽泛规则，后放狭窄
规则。

`permission: "allow"`（顶层字符串）是“允许
所有内容”的简写，通常不是用户想要的配置。

已知权限 key：`read, edit, glob, grep, list, bash, task,
external_directory, todowrite, question, webfetch, websearch, lsp, doom_loop,
skill`。其中部分 key（`todowrite,
question, webfetch, websearch, doom_loop`）只接受扁平
操作，不接受按模式配置的对象。

`external_directory` 模式是文件系统路径（使用 `~/`、绝对路径
或 `~/projects/**` 等 glob）。

每个代理的 `permission:` 会覆盖顶层 `permission:`。Plan Mode 位于
`plan` 代理的权限规则集上（`edit: deny *`）。

## 应急手段

当用户的配置损坏、miaopan-code 无法启动时，可以使用以下环境变量：

- `MIAOPAN_CODE_DISABLE_PROJECT_CONFIG=1`：跳过项目的本地 `miaopan-code.json`，
  只从全局配置启动。在项目目录中运行后，miaopan-code 会启动，
  用户编辑损坏的文件，然后在不带该 flag 的情况下重新启动。
- `MIAOPAN_CODE_CONFIG=/path/to/file.json`：加载一个额外的显式配置。
- `MIAOPAN_CODE_CONFIG_CONTENT='{"$schema":"https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json"}'`：
  注入内联 JSON，作为本地范围的最终合并项。
- `MIAOPAN_CODE_DISABLE_DEFAULT_PLUGINS=1`：跳过默认插件。
- `MIAOPAN_CODE_PURE=1`：完全跳过外部插件。
- `MIAOPAN_CODE_DISABLE_EXTERNAL_SKILLS=1`、
  `MIAOPAN_CODE_DISABLE_CLAUDE_CODE_SKILLS=1`：跳过
  `~/.claude/` 和 `~/.agents/` 下的外部技能扫描。

## 提议编辑时

- 写入前根据 Schema 进行验证。如果不确定字段的
  确切结构，或者本技能没有涵盖该字段，请获取
  `https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json` 并阅读 Schema，不要猜测。修改 `tui.json` 时读取 TUI Schema。
- 保留 `$schema` 以及用户没有要求更改的所有现有字段。
- 对于代理、命令、技能和插件定义，优先在正确位置创建新文件，
  而不是将所有内容内联到 `miaopan-code.json` 中。
- 如果用户现有的配置格式错误，请向他们说明上述环境变量应急
  手段，以便他们能从 miaopan-code 内部编辑，而不会中断
  会话。
- 保存任何配置更改后，提醒用户退出并重新启动 miaopan-code
  ——正在运行的会话会继续使用已经加载的配置。
