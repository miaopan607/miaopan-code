# 配置指南

语言：简体中文 · [English](configuration.en.md)

miaopan-code 使用 JSON 或 JSONC 配置文件。本文介绍配置文件的位置、合并规则和常用功能；所有字段的类型、枚举和默认值以 [配置 Schema](../schemas/config.json) 为准。TUI 专用设置请参阅 [TUI Schema](../schemas/tui.json)。

## 快速开始

在项目根目录创建 `miaopan-code.jsonc`：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json",
  "language": "zh-CN",
  "model": "provider/model-id",
  "autoupdate": "notify",
}
```

`$schema` 可以让支持 JSON Schema 的编辑器提供补全和即时校验。`model` 必须包含 Provider 前缀，例如 `anthropic/claude-sonnet-4-6`。

## 配置文件位置

| 范围     | 文件位置                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| 项目配置 | `./miaopan-code.json`、`./miaopan-code.jsonc`、`.miaopan-code/miaopan-code.json` 或 `.miaopan-code/miaopan-code.jsonc` |
| 全局配置 | 系统配置目录下的 `miaopan-code/miaopan-code.jsonc` 或 `miaopan-code.json`；Linux 默认是 `~/.config/miaopan-code/`      |
| 额外配置 | `MIAOPAN_CODE_CONFIG` 指定的文件，或 `MIAOPAN_CODE_CONFIG_CONTENT` 提供的内联 JSON                                     |

miaopan-code 会从当前目录向上查找项目配置，直到 worktree 根目录。配置按范围合并，后加载的项目配置覆盖全局配置；对象会深度合并。未知的顶层字段会导致配置校验失败。

大多数配置在启动时加载。修改配置、Agent、命令、技能或插件文件后，应退出并重新启动 miaopan-code。通过 TUI `/language` 命令切换语言会立即生效，并写入全局配置。

## 常用顶层字段

| 字段            | 用途                              | 示例                               |
| --------------- | --------------------------------- | ---------------------------------- |
| `language`      | 界面、内建工具和模型提示的语言    | `"zh-CN"`、`"en"`                  |
| `model`         | 默认模型                          | `"provider/model-id"`              |
| `default_agent` | 默认主 Agent                      | `"build"`                          |
| `username`      | 对话中显示的用户名                | `"小明"`                           |
| `shell`         | 终端和 shell 工具使用的默认 shell | `"/bin/zsh"`                       |
| `autoupdate`    | 自动更新策略                      | `true`、`false`、`"notify"`        |
| `share`         | 会话分享策略                      | `"manual"`、`"auto"`、`"disabled"` |
| `instructions`  | 附加指令文件或 glob               | `["AGENTS.md", "docs/*.md"]`       |
| `formatter`     | 启用、禁用或覆盖格式化程序        | `true`、`false` 或对象             |
| `lsp`           | 启用、禁用或覆盖 LSP 服务         | `true`、`false` 或对象             |

实验性字段和不常用字段可能变化，请在使用前检查 Schema，不要根据旧示例猜测字段结构。

## 完整顶层字段索引

所有顶层字段都是可选的。对象字段除非另有说明，均拒绝未在 Schema 中声明的子字段。

| 字段                 | 类型                                     | 说明                              |
| -------------------- | ---------------------------------------- | --------------------------------- |
| `$schema`            | `string`                                 | JSON Schema 地址                  |
| `language`           | `"zh-CN" \| "en"`                        | 运行时语言，默认 `zh-CN`          |
| `shell`              | `string`                                 | 默认 shell                        |
| `logLevel`           | `"DEBUG" \| "INFO" \| "WARN" \| "ERROR"` | 日志级别                          |
| `server`             | `object`                                 | `serve` 和 `web` 命令的网络配置   |
| `command`            | `Record<string, Command>`                | 内联命令定义                      |
| `skills`             | `object`                                 | 附加技能目录和远程索引            |
| `references`         | `Record<string, Reference>`              | 本地目录或 Git 引用               |
| `reference`          | `Record<string, Reference>`              | 已弃用，改用 `references`         |
| `watcher`            | `object`                                 | 文件监听忽略规则                  |
| `snapshot`           | `boolean`                                | 是否记录文件系统快照              |
| `plugin`             | `Array<string \| [string, object]>`      | 插件列表                          |
| `share`              | `"manual" \| "auto" \| "disabled"`       | 分享策略                          |
| `autoshare`          | `boolean`                                | 是否自动分享新会话                |
| `autoupdate`         | `boolean \| "notify"`                    | 自动更新策略                      |
| `disabled_providers` | `string[]`                               | 禁用指定 Provider                 |
| `enabled_providers`  | `string[]`                               | 只启用指定 Provider               |
| `model`              | `string`                                 | 默认模型，格式为 `provider/model` |
| `review_mode`        | `"codex" \| "opencode"`                  | `/review` 后端，默认 `codex`      |
| `small_model`        | `string`                                 | 标题等辅助任务使用的模型          |
| `default_agent`      | `string`                                 | 默认主 Agent                      |
| `username`           | `string`                                 | 对话中显示的用户名                |
| `mode`               | `Record<string, Agent>`                  | 已弃用，改用 `agent`              |
| `agent`              | `Record<string, Agent>`                  | Agent 定义和内置 Agent 覆盖       |
| `provider`           | `Record<string, Provider>`               | Provider 和模型覆盖               |
| `mcp`                | `Record<string, MCP>`                    | MCP 服务器                        |
| `formatter`          | `boolean \| Record<string, Formatter>`   | 格式化程序                        |
| `lsp`                | `boolean \| Record<string, LSP>`         | LSP 服务                          |
| `instructions`       | `string[]`                               | 附加指令文件或 glob               |
| `question`           | `object`                                 | 提问工具行为                      |
| `layout`             | `"auto" \| "stretch"`                    | 已弃用，运行时始终使用 `stretch`  |
| `permission`         | `Permission`                             | 全局工具权限                      |
| `tools`              | `Record<string, boolean>`                | 工具启停映射                      |
| `attachment`         | `object`                                 | 附件和图像限制                    |
| `enterprise`         | `object`                                 | 企业服务地址                      |
| `tool_output`        | `object`                                 | 工具输出截断阈值                  |
| `compaction`         | `object`                                 | 上下文压缩策略                    |
| `experimental`       | `object`                                 | 实验性功能                        |

## 服务、监听和分享

`server` 支持 `port`、`hostname`、`mdns`、`mdnsDomain` 和 `cors`；`port` 必须为正整数，`cors` 是额外允许的来源数组。`watcher.ignore` 是文件监听忽略 glob。`snapshot` 控制文件系统快照，`share` 控制分享模式，`autoshare` 控制是否自动分享新会话。

## Provider 和模型

`model` 使用 `provider/model-id` 格式。Provider 的认证信息和自定义选项放在 `provider` 中：

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

也可以在 TUI 中运行 `/connect`，或通过 CLI 配置 Provider。密钥建议使用环境变量或认证存储，不要提交到仓库。

### Provider 与模型字段

Provider 条目支持 `api`、`name`、`env`、`id`、`npm`、`whitelist`、`blacklist`、`options` 和 `models`。`options` 支持 `apiKey`、`baseURL`、`enterpriseUrl`、`setCacheKey`、`timeout`、`headerTimeout` 和 `chunkTimeout`；超时单位均为毫秒，`timeout` 和 `headerTimeout` 可设为 `false`。

`provider.<id>.models.<model>` 支持：

| 字段                                                  | 类型与说明                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `id`、`name`、`family`、`release_date`                | 字符串元数据                                                                                 |
| `compaction_model`                                    | 此模型使用的压缩模型，格式为 `provider/model`                                                |
| `attachment`、`reasoning`、`temperature`、`tool_call` | 模型能力布尔值                                                                               |
| `interleaved`                                         | `true` 或 `{ field }`；`field` 为 `reasoning`、`reasoning_content`、`reasoning_details` 之一 |
| `cost`                                                | `input`、`output` 必填；可含 `cache_read`、`cache_write`、`context_over_200k`                |
| `limit`                                               | `context`、`output` 必填，`input` 可选                                                       |
| `modalities`                                          | `input`、`output` 数组；值为 `text`、`audio`、`image`、`video`、`pdf`                        |
| `experimental`                                        | 是否为实验模型                                                                               |
| `status`                                              | `alpha`、`beta`、`deprecated`、`active`                                                      |
| `provider`                                            | 模型级 `{ npm?, api? }` 覆盖                                                                 |
| `options`                                             | 模型请求选项对象                                                                             |
| `headers`                                             | 模型级请求头                                                                                 |
| `variants.<name>.disabled`                            | 是否禁用指定变体                                                                             |

## Agent

简单 Agent 可以内联定义：

```jsonc
{
  "agent": {
    "reviewer": {
      "description": "审查代码质量和潜在缺陷。",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-6",
      "permission": {
        "edit": "deny",
        "bash": "ask",
      },
      "prompt": "重点检查正确性、可维护性和测试覆盖。",
    },
  },
}
```

复杂 Agent 建议放在 `.miaopan-code/agent/<name>.md` 或 `.miaopan-code/agents/<name>.md`：

```markdown
---
description: 审查代码质量和潜在缺陷。
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
  bash: ask
---

重点检查正确性、可维护性和测试覆盖。
```

文件正文就是 Agent 的提示词，不要再在 frontmatter 中添加 `prompt`。`mode` 可设为 `primary`、`subagent` 或 `all`。使用 `agent: { build: { disable: true } }` 可以禁用同名内置 Agent。

Agent 的完整字段为：`model: string`、`variant: string`、`temperature: number`、`top_p: number`、`prompt: string`、`disable: boolean`、`description: string`、`mode: "subagent" | "primary" | "all"`、`hidden: boolean`、`options: object`、`color`、`steps: positive integer` 和 `permission`。`color` 可以是六位十六进制颜色，或 `primary`、`secondary`、`accent`、`success`、`warning`、`error`、`info`。`tools` 和 `maxSteps` 是弃用兼容字段。

## 技能和命令

技能文件必须命名为 `SKILL.md`，并放在独立目录中：

```text
.miaopan-code/skills/my-skill/SKILL.md
```

```markdown
---
name: my-skill
description: 说明技能做什么以及应在何时使用。
---

# 技能说明

这里写指令、示例和参考资料。
```

可以通过 `skills.paths` 添加本地技能搜索目录，通过 `skills.urls` 添加远程技能列表：

```jsonc
{
  "skills": {
    "paths": [".miaopan-code/skills", "/absolute/path/to/skills"],
    "urls": ["https://example.com/.well-known/skills/"],
  },
}
```

自定义命令放在 `.miaopan-code/command/<name>.md` 或 `.miaopan-code/commands/<name>.md`。文件正文是命令模板，支持 `$ARGUMENTS` 和 `$1`、`$2` 等位置参数。

内联 `command.<name>` 要求 `template: string`，并可设置 `description: string`、`agent: string`、`model: string`、`variant: string`、`subtask: boolean`。

## 外部引用

`references` 可以把项目之外的本地目录或 Git 仓库加入上下文：

```jsonc
{
  "references": {
    "docs": {
      "path": "../product-docs",
      "description": "产品行为和术语说明",
    },
    "effect": {
      "repository": "Effect-TS/effect",
      "branch": "main",
      "description": "Effect 实现参考",
    },
  },
}
```

别名会用于 `@docs` 形式的自动补全。只有带 `description` 的引用会主动告知 Agent；`hidden: true` 只会隐藏 TUI 自动补全，不会禁止直接访问。

## 插件

`plugin` 是数组，条目可以是 npm spec、本地文件，或带选项的元组：

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

`.miaopan-code/plugin/` 和 `.miaopan-code/plugins/` 中的 `*.ts`、`*.js` 文件会被自动发现，无需写入 `plugin` 数组。

## MCP 服务器

本地 MCP 服务器使用字符串数组形式的 `command`：

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

字符串值支持 `{env:VAR}` 和 `{file:path}` 插值。使用 `enabled: false` 可以禁用从低优先级配置继承的服务器。

本地 MCP 要求 `type` 和 `command`，还支持 `cwd`、`environment`、`enabled`、`timeout`。远程 MCP 要求 `type` 和 `url`，还支持 `headers`、`enabled`、`timeout`、`oauth`。`timeout` 是正整数毫秒值，默认 5000。`oauth` 可设为 `false`，或包含 `clientId`、`clientSecret`、`scope`、`callbackPort`、`redirectUri`；回调端口范围为 1–65535。

## 权限

权限操作有 `allow`、`ask` 和 `deny`：

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

模式规则采用最后一条匹配结果，因此应先写宽泛规则，再写更具体的规则。每个 Agent 的 `permission` 会覆盖顶层权限。顶层 `permission: "allow"` 表示允许所有操作，通常不建议使用。

## Formatter 和 LSP

`formatter` 和 `lsp` 可设为 `true` 启用内置注册，设为 `false` 全部禁用，也可使用对象覆盖或添加条目。

- Formatter 条目支持 `disabled: boolean`、`command: string[]`、`environment: Record<string, string>`、`extensions: string[]`。
- 自定义 LSP 条目要求 `command: string[]`，并支持 `extensions: string[]`、`env: Record<string, string>`、`initialization: object`、`disabled: boolean`。
- 仅禁用已有 LSP 时可使用 `{ "disabled": true }`。

## 附件、输出、提问和压缩

| 路径                                | 类型      | 默认值或说明                          |
| ----------------------------------- | --------- | ------------------------------------- |
| `attachment.image.auto_resize`      | `boolean` | 默认 `true`；超限图像在发送前缩放     |
| `attachment.image.max_width`        | 正整数    | 默认 `2000`                           |
| `attachment.image.max_height`       | 正整数    | 默认 `2000`                           |
| `attachment.image.max_base64_bytes` | 正整数    | 默认 `5242880`                        |
| `tool_output.max_lines`             | 正整数    | 默认 `2000`；达到后截断预览并保存全文 |
| `tool_output.max_bytes`             | 正整数    | 默认 `51200`；与行数限制先到者生效    |
| `question.auto_resolution`          | `boolean` | 默认 `true`；等待结束后允许提交空回答 |
| `compaction.auto`                   | `boolean` | 默认 `true`；上下文将满时自动压缩     |
| `compaction.prune`                  | `boolean` | 默认 `false`；清理旧工具输出          |
| `compaction.tail_turns`             | 非负整数  | 默认 `2`；逐字保留的最近用户轮次      |
| `compaction.preserve_recent_tokens` | 非负整数  | 逐字保留的最近 Token 上限             |
| `compaction.preserve_brief_history` | `boolean` | 默认 `false`；保留每轮简要历史        |
| `compaction.reserved`               | 非负整数  | 为输出和压缩预留的上下文窗口          |

## 其他字段与实验性字段

- `instructions`：附加指令文件路径或 glob 数组。
- `tools`：以工具 ID 为 key 的布尔启停映射。
- `enterprise.url`：企业服务地址。
- `experimental.disable_paste_summary`：禁用粘贴内容摘要。
- `experimental.batch_tool`：启用批处理工具。
- `experimental.openTelemetry`：为 AI SDK 调用启用 OpenTelemetry span。
- `experimental.primary_tools`：仅主 Agent 可用的工具 ID 数组。
- `experimental.continue_loop_on_deny`：工具调用被拒绝后继续 Agent 循环。
- `experimental.mcp_timeout`：正整数毫秒值。
- `experimental.policies`：策略数组；每项要求 `action: "provider.use"`、`effect: "allow" | "deny"`、`resource: string`。

实验性字段不保证兼容性。

## 弃用字段

- `reference`：改用 `references`。
- `mode`：改用 `agent`。
- `layout`：不再改变布局，运行时始终使用 `stretch`。
- `agent.<name>.tools`：保留兼容性，新配置优先使用权限和当前工具配置。
- `agent.<name>.maxSteps`：改用 `steps`。

## TUI 配置

TUI 的主题、按键和 TUI 插件等设置使用单独的 `tui.json` 或 `tui.jsonc`。文件可以放在全局配置目录、项目目录的 `.miaopan-code/` 中，或由项目目录向上发现。

| 字段                  | 类型                                | 说明                                         |
| --------------------- | ----------------------------------- | -------------------------------------------- |
| `$schema`             | `string`                            | [TUI Schema](../schemas/tui.json) 地址       |
| `theme`               | `string`                            | 主题 ID                                      |
| `keybinds`            | `object`                            | 按键覆盖；可用动作 ID 由 TUI Schema 完整列出 |
| `plugin`              | `Array<string \| [string, object]>` | TUI 插件                                     |
| `plugin_enabled`      | `Record<string, boolean>`           | 按插件 ID 启用或禁用                         |
| `leader_timeout`      | `integer`                           | Leader 组合键超时，单位毫秒                  |
| `attention`           | `object`                            | 通知和声音                                   |
| `prompt`              | `object`                            | 输入框尺寸                                   |
| `scroll_speed`        | `number`                            | 滚动速度                                     |
| `scroll_acceleration` | `{ enabled: boolean }`              | 滚动加速                                     |
| `diff_style`          | `"auto" \| "stacked"`               | Diff 布局                                    |
| `tool_display`        | `"compact" \| "detailed"`           | 工具调用显示方式                             |
| `mouse`               | `boolean`                           | 是否捕获鼠标，默认 `true`                    |

`attention` 支持 `enabled`、`notifications`、`sound`、`volume`、`sound_pack`，以及 `sounds.default`、`question`、`permission`、`error`、`done`、`subagent_done`。`prompt.max_height` 是输入框最大高度；`prompt.max_width` 是正整数或 `"auto"`。

每个 `keybinds.<action>` 接受按键字符串、按键描述对象、这些值的数组，或 `false`/`"none"` 来禁用。动作覆盖应用、命令、Diff、会话、模型、Agent、消息、输入框、对话框、插件和终端操作；准确的动作 ID 以 [TUI Schema](../schemas/tui.json) 的 `keybinds.properties` 为准，编辑器会基于 `$schema` 自动补全全部动作。

## Codex 请求版本

Codex 模型请求默认使用版本 `0.144.1` 模拟 `codex-tui`。设置 `MIAOPAN_CODE_CODEX_VERSION` 可以覆盖该版本；它会同时出现在 User-Agent 的前缀和末尾客户端信息中。修改后需要重新启动 miaopan-code。

## 配置损坏时恢复

如果错误配置导致 miaopan-code 无法启动，可以临时使用以下环境变量：

- `MIAOPAN_CODE_DISABLE_PROJECT_CONFIG=1`：跳过项目配置，仅加载全局配置。
- `MIAOPAN_CODE_CONFIG=/path/to/file.json`：额外加载指定配置文件。
- `MIAOPAN_CODE_CONFIG_CONTENT='{...}'`：将内联 JSON 作为最后的配置合并项。
- `MIAOPAN_CODE_DISABLE_DEFAULT_PLUGINS=1`：跳过默认插件。
- `MIAOPAN_CODE_PURE=1`：跳过所有外部插件。
- `MIAOPAN_CODE_DISABLE_EXTERNAL_SKILLS=1`：跳过外部技能扫描。

修复文件后，移除临时环境变量并重新启动。

## 校验建议

1. 始终保留 `$schema`。
2. 让编辑器根据 Schema 提供补全和错误提示。
3. 修改前确认当前版本的 [配置 Schema](../schemas/config.json)。
4. 不要把 API key、token 等敏感信息提交到版本控制。
5. 修改配置期文件后重新启动 miaopan-code。
