# V2 配置评审

语言：简体中文 · [English](config.en.md)

本文档将旧版配置 Schema 拆分为较小的评审组。每次处理一组，并决定各字段是按原样移植、移除，还是为 v2 重新设计。

## 状态标签

- `pending`：尚未讨论
- `keep`：基本按现有含义移植
- `remove`：不继续保留
- `redesign`：以不同结构、作用域或所属模块保留该能力

## Schema 作用域

目前使用一个 v2 配置 Schema。`autoupdate` 等字段面向全局/用户配置，但现在还没有足够收益通过不同的全局和 location Schema 强制区分。如果评审后保留了更多对作用域敏感的字段，再重新考虑此事。

V2 Core 会在全局配置目录、祖先项目目录以及 `.miaopan-code` 配置目录中发现名为 `miaopan-code.json` 或 `miaopan-code.jsonc` 的配置文档。V2 不支持旧版 `config.json` 文件名。

## 第 1 组：文件元数据

描述配置文件本身而非应用行为的小型字段。

| 字段      | 当前用途                                | 状态 | 说明                                                       |
| --------- | --------------------------------------- | ---- | ---------------------------------------------------------- |
| `$schema` | 用于编辑器验证和补全的 JSON Schema 引用 | keep | 保留为只读元数据；加载配置不得插入它，也不得为此创建文件。 |

## 第 2 组：进程与服务器设置

影响进程启动、shell 执行或网络服务的设置。请仔细评审仅限全局与 location 专用作用域的区别。

| 字段         | 当前用途                              | 状态   | 说明                                                       |
| ------------ | ------------------------------------- | ------ | ---------------------------------------------------------- |
| `shell`      | 终端和 shell 工具执行使用的默认 shell | keep   | 作为有效配置移植；miaopan-code 各处会使用共享 shell 选择。 |
| `logLevel`   | 预期的日志级别配置                    | remove | 不移植：没有配置消费者，日志从 CLI 输入初始化。            |
| `server`     | 主机名、端口、mDNS 和 CORS 设置       | remove | 不移植：服务器运行后才会加载 location 配置。               |
| `autoupdate` | 自动更新或通知行为                    | keep   | 仅限全局的用户偏好；保留 `true`、`false` 和 `"notify"`。   |

## 第 3 组：命令与项目资源

引入 location 作用域项目资源或可发现内容的配置。

| 字段           | 当前用途                | 状态     | 说明                                                                      |
| -------------- | ----------------------- | -------- | ------------------------------------------------------------------------- |
| `command`      | 用户定义的命令          | remove   | 不作为 v2 配置移植；具名可复用用户工作流属于 skill。                      |
| `skills`       | 额外的 skill 位置       | redesign | 将 `{ paths?, urls? }` 替换为由本地路径或远程 URL 发现源组成的单个数组。  |
| `reference`    | 具名 Git 或本地目录引用 | redesign | 重命名为复数 `references`；保留具名本地路径和 Git 仓库外部 context 条目。 |
| `instructions` | 额外的环境指令源        | keep     | 保留一个本地路径、glob 模式或远程 URL 数组，用于提供自动包含的 context。  |

V2 不公开单独由用户编写的命令配置。Skill 应覆盖具名可复用 prompt 工作流，无论它是由用户直接调用还是由代理加载。内部命令路由和内置命令可以继续作为运行时关注点，而无需创建 `command` 或 `commands` 配置字段。

这有意不移植旧版命令专用行为，例如每条命令的 `model`、`agent`、`subtask`、prompt shell 展开或位置/template 替换。如果 v2 需要相关能力，应在其所属领域中进行设计，而不是通过第二套工作流定义系统保留。

将 `skills` 保留为发现源配置，而不是内联工作流定义。Skill 内容仍由 `SKILL.md` 所有；每个 `skills` 条目可以是本地搜索根目录或远程发现 URL。可以单独设计直接调用行为，而无需扩展配置结构。

```jsonc
{
  "skills": ["./team-skills", "~/shared-skills", "https://example.com/.well-known/skills/"],
}
```

保持环境指令与 skill 分离。指令会自动作为模型 context 包含，而 skill 会被有意加载或调用。每个来源都明确属于本地路径/glob 或 URL，因此 v2 保留简单数组结构：

```jsonc
{
  "instructions": [
    "CONTRIBUTING.md",
    "docs/guidelines.md",
    ".cursor/rules/*.md",
    "https://example.com/shared-rules.md",
  ],
}
```

保留具名外部 context 引用作为 v2 配置能力，并重命名为复数 `references`，因为它是按别名设置 key 的集合。引用声明本地目录或 Git 仓库；v2 运行时实现该行为后，可以通过 `@alias` 或 `@alias/path` 引用它们。

```jsonc
{
  "references": {
    "design-system": { "path": "../ui-library" },
    "sdk": { "repository": "github.com/example/sdk", "branch": "main" },
  },
}
```

同时保留紧凑字符串条目形式：以 `.`、`/` 或 `~` 开头的值代表本地路径，其他字符串代表 Git 仓库。

## 第 4 组：插件

插件加载具有源路径和作用域敏感行为，因此应与其他项目资源分开评审。

| 字段     | 当前用途           | 状态     | 说明                                                                                |
| -------- | ------------------ | -------- | ----------------------------------------------------------------------------------- |
| `plugin` | 用户指定的插件模块 | redesign | 重命名为复数 `plugins`；保留使用包字符串或 `{ package, options? }` 条目的有序加载。 |

插件顺序仍是 v2 配置契约的一部分，因为钩子注册和执行可能依赖加载顺序。将旧版选项 tuple 替换为可读的对象条目：

```jsonc
{
  "plugins": [
    "miaopan-code-helicone-session",
    {
      "package": "@my-org/audit-plugin",
      "options": {
        "endpoint": "https://audit.example.com",
      },
    },
  ],
}
```

配置的 `plugins` 列表只代表由包加载的插件。本地插件代码仍从 `.miaopan-code/plugins/` 等插件目录发现；v2 不会将任意配置的本地路径或文件 URL 移植到此字段中。

## 第 5 组：文件系统与工具运行时

控制本地文件观测、快照、语言工具和工具输出行为的设置。

| 字段          | 当前用途               | 状态     | 说明                                                                                                                          |
| ------------- | ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `watcher`     | 文件系统监视的忽略模式 | keep     | 保留 `{ ignore?: string[] }`；它配置文件系统 watcher 子系统。                                                                 |
| `snapshot`    | 启用文件系统快照跟踪   | redesign | 重命名为复数 `snapshots`；控制创建用于撤销和还原行为的快照。                                                                  |
| `formatter`   | 配置格式化程序         | keep     | 保留单数 `boolean \| Record<string, entry>` 结构；它配置内置启用状态和具名 formatter 覆盖。                                   |
| `lsp`         | 配置语言服务器         | keep     | 保留单数 `boolean \| Record<string, entry>` 结构；自定义服务器需要命令和文件扩展名。                                          |
| `attachment`  | 配置附件/图像处理      | redesign | 重命名为复数 `attachments`；为输入规范化限制保留 `{ image?: { auto_resize?, max_width?, max_height?, max_base64_bytes? } }`。 |
| `tool_output` | 配置工具输出截断限制   | keep     | 保留 `{ max_lines?, max_bytes? }`；两个正阈值都应用于已保存预览的截断行为。                                                   |

`formatter` 和 `lsp` 各自配置一个项目工具子系统，因此单数名称仍然合适。`true` 启用内置注册，`false` 禁用它们；带 key 的对象启用内置项，同时应用具名覆盖或自定义注册。自定义语言服务器必须声明 `extensions`，以确保运行时文件附件行为具有确定性；已知内置服务器 ID 的验证属于最终的 v2 LSP 集成，而不是聚合 Core 配置 Schema。

在 v2 中将旧版 `attachment` 重命名为 `attachments`。此设置控制附件领域的处理，并且未来可能扩展到图像处理以外；而单数 `attachment` 已被用作模型能力标志，表示某个模型是否接受附件。

```jsonc
{
  "formatter": {
    "prettier": { "disabled": true },
    "project": { "command": ["./scripts/format", "$FILE"], "extensions": [".foo"] },
  },
  "lsp": {
    "typescript": { "disabled": true },
    "project": { "command": ["project-language-server", "--stdio"], "extensions": [".foo"] },
  },
  "attachments": {
    "image": { "auto_resize": true, "max_width": 2000, "max_height": 2000 },
  },
  "tool_output": { "max_lines": 2000, "max_bytes": 51200 },
}
```

## 第 6 组：共享与身份

影响共享行为或用户/账户身份，而不是模型执行的设置。

| 字段         | 当前用途                 | 状态   | 说明                                                                                 |
| ------------ | ------------------------ | ------ | ------------------------------------------------------------------------------------ |
| `share`      | Session 共享行为         | keep   | 保留 `"manual" \| "auto" \| "disabled"`；它控制手动共享权限和新 session 的自动共享。 |
| `autoshare`  | 旧版自动共享标志         | remove | 不移植已弃用别名；使用 `share: "auto"`。                                             |
| `enterprise` | 企业 URL 配置            | keep   | 保留 `{ url?: string }`；当前在没有活动组织账户时选择旧版共享服务端点。              |
| `username`   | 在对话和遥测中显示用户名 | keep   | 保留字符串身份覆盖；否则运行时可以解析操作系统用户名。                               |

将 `share` 保留为唯一 session 共享设置。`"manual"` 允许显式共享，`"auto"` 共享新创建的顶级 session，`"disabled"` 阻止共享。旧版 `autoshare: true` 只是 `share: "auto"` 的别名，因此 v2 不公开它。

保留 `enterprise.url` 以选择旧版企业共享托管服务，并保留 `username` 作为面向用户的身份覆盖。它们与服务器认证凭据分离；`username` 标识对话和遥测行为中的用户，而不是 HTTP basic-auth 配置。

```jsonc
{
  "share": "disabled",
  "enterprise": { "url": "https://share.example.com" },
  "username": "developer",
}
```

## 第 7 组：提供商与模型选择

提供商 catalog 自定义和模型选择配置。新的 Core 工作已经从这里开始。

| 字段                 | 当前用途                       | 状态     | 说明                                                                                            |
| -------------------- | ------------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `provider`           | 自定义提供商配置和模型覆盖     | redesign | 在 v2 中重命名为复数 `providers`；不保留旧版单数 key。单独评审嵌套的提供商/模型字段。           |
| `disabled_providers` | 禁用自动加载的提供商           | redesign | 替换为 `experimental.policies: [{ effect: "deny", action: "provider.use", resource: "..." }]`。 |
| `enabled_providers`  | 将已启用提供商限制到 allowlist | redesign | 替换为有序 `provider.use` allow/deny 语句和通配符 resource。                                    |
| `model`              | 默认模型选择                   | keep     | 活动 session 或 agent 未指定模型时，保留为回退模型。                                            |
| `small_model`        | 小型/工具模型选择              | remove   | 不移植；它唯一的运行时消费者是标题生成，而标题可使用显式 `title` agent 模型覆盖。               |

提供商选择规则属于 `experimental.policies`，而不是提供商条目或重复的顶级提供商字段。初始建议结构：

```jsonc
{
  "experimental": {
    "policies": [
      {
        "effect": "deny",
        "action": "provider.use",
        "resource": "*",
      },
      {
        "effect": "allow",
        "action": "provider.use",
        "resource": "anthropic",
      },
    ],
  },
}
```

提供商政策语义和优先级规则参见 [provider-policy.md](./provider-policy.md)。

政策求值会以相反顺序使用编写的配置文档，同时保留每份文档中的语句顺序。在评审 `.miaopan-code` 配置前，`.miaopan-code` 政策源的优先级仍待确定。

提供商配置在 v2 中使用复数 `providers` key。这有意与旧版单数 `provider` key 不同；v2 配置接口仍在定义期间，不添加兼容别名。

将 `model` 保留为默认模型回退。它是活动 session 或 agent 没有显式模型选择时使用的应用级行为，因此不属于任何单独提供商配置内部。

不移植 `small_model`。当前运行时仅在生成 session 标题时查询它：首先使用 `title` agent 模型，然后使用 `small_model`，最后使用自动/当前模型回退。在 v2 中，需要指定标题模型的用户应直接配置 `title` agent，而不是使用单独的顶级模型设置。

提供商、模型、variant 和临时 agent 的 `options` 以部分补丁形式编写，而不是完全具体化的运行时选项记录。用户应能只设置所需覆盖，例如标头或 AI SDK 请求选项；catalog 状态提供空默认值，并按配置顺序合并补丁。

将提供商 `env` 保留为已识别凭据环境变量名称的编写列表。内置 catalog 提供商已携带此元数据，以支持由环境变量自动提供的可用性，配置的提供商也可能需要声明相同来源。对配置的提供商而言，这是附加元数据，并不要求其中一个变量必须存在：提供商也可以通过配置选项、存储的账户或无需凭据的端点使用。

在配置的模型中，将旧版上游模型标识符 `id` 与模型 API 覆盖的其余内容一起嵌套在 `api.id` 下。模型 `limit` 是编写的补丁，因此覆盖可以只改变 `context`、`input` 或 `output`。模型 `cost` 接受一个简单定价对象或 tiered 定价条目数组；省略的缓存价格默认为零。

不要将旧版提供商模型 `reasoning`、`temperature` 或 `interleaved` 标志作为一等配置字段移植；提供商/请求行为属于结构化 `options` 或模型 variant。不要在此 v2 接口中移植 `release_date`、`status`、`experimental`、`whitelist` 或 `blacklist`。

```jsonc
{
  "providers": {
    "internal": {
      "env": ["INTERNAL_LLM_API_KEY"],
      "options": { "headers": { "Authorization": "Bearer {env:API_KEY}" } },
      "models": {
        "chat": {
          "api": { "id": "upstream-chat-model" },
          "limit": { "output": 32768 },
          "cost": { "input": 1.25, "output": 10 },
          "variants": [{ "id": "high", "aisdk": { "request": { "reasoningEffort": "high" } } }],
        },
      },
    },
  },
}
```

## 第 8 组：Agent 与权限

Agent 行为和工具访问政策。二者应一起评审，因为 agent 配置可以包含权限和模型选择。

| 字段            | 当前用途                            | 状态     | 说明                                                                                            |
| --------------- | ----------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `default_agent` | 选择默认 primary agent              | remove   | 不保留单独的顶级选择器；默认选择应与 v2 agent 配置模型一起设计。                                |
| `mode`          | 旧版 agent 配置别名                 | remove   | 不移植已弃用别名；只通过 v2 agent 接口配置 agent。                                              |
| `agent`         | 配置 primary、subagent 和专用 agent | redesign | 重命名为复数 `agents`；保留内置覆盖和自定义 agent 定义的具名 map。                              |
| `permission`    | 工具权限规则                        | redesign | 重命名为复数 `permissions`；将旧版 map 简写替换为有序 `{ action, resource, effect }` 规则数组。 |
| `tools`         | 旧版工具启用/禁用 map               | remove   | 不移植布尔启用/禁用别名；通过权限表达工具访问。                                                 |

在 v2 agent 设计前不要移植 `default_agent`。旧版运行时使用它选择可见的非 subagent 回退，而不是 `build`；但将该选择公开为孤立的顶级字段，会在 agent 及其政策接口共同定义前，让 v2 预先承诺采用旧版 agent 模型。

不要移植 `mode`。旧版加载器已将此弃用别名合并到 `agent` 中，v2 应只公开一套 agent 定义编写接口。

将旧版 `agent` 重命名为 `agents`，因为该设置是以 agent 名称为 key 的集合。它应继续支持覆盖 `build`、`plan`、`title` 等内置 agent，以及声明具名自定义 agent。在决定 agent 本地 `permission` 和弃用 `tools` 行为前，嵌套条目 Schema 保持开放。

保留嵌套的 `agents.<name>.mode`，取值为 `"primary"`、`"subagent"` 或 `"all"`。它标识 agent 的运行时角色，与被移除的顶级旧版 `mode` 别名不同；后者是 agent 定义的替代容器。

对于 v2 中的具名可配置条目，当条目应保持配置但不活动时，统一使用 `disabled?: boolean`。因此，agent 定义应将旧版 `disable` 重新设计为 `disabled`；这与 formatter、语言服务器、未来 MCP 服务器定义和配置模型覆盖一致。运行时 catalog 状态仍可用 `enabled` 跟踪活动可用性；该状态不是用户编写的配置。

在 agent 定义上保留分开的 `model` 和 `variant` 字段。模型引用使用 `provider/model-id`，但模型 ID 本身可能包含斜杠分隔的片段，例如 `openrouter/openai/gpt-5`；将 variant 附加到该字符串会产生歧义。

在 agent 定义上保留 `color`。Agent 是用户可见、可选择的实体，因此用户编写的显示颜色是 agent 的适当元数据，而不是无关的应用呈现设置。保留现有配置支持的十六进制颜色和具名主题颜色。

暂时保留 agent 本地 `options`，使用配置提供商和模型可用的同一结构化提供商选项结构：headers、body 和 AI SDK provider/request 覆盖。其长期归属仍待团队评审，因为可复用的提供商专用预设也可以建模为 variant。不要保留专用 agent `temperature` 或 `top_p` 字段。

保留 `description`、`hidden` 和 `steps`；它们定义 agent 的可发现性、可见性和迭代预算，而不是模型请求参数。将旧版 agent `prompt` 重命名为 `system`，明确它提供持久系统级 agent 内容，而不会与顶级环境 `instructions` 冲突。移除已弃用的 `maxSteps`，改用 `steps`。

```jsonc
{
  "agents": {
    "reviewer": {
      "model": "openrouter/openai/gpt-5",
      "variant": "high",
      "options": {
        "headers": { "x-agent": "reviewer" },
        "body": {},
        "aisdk": { "provider": {}, "request": { "reasoningEffort": "high" } },
      },
      "description": "Review changes for correctness",
      "system": "Find regressions and missing tests.",
      "mode": "subagent",
      "color": "warning",
      "steps": 12,
      "disabled": false,
      "permissions": [{ "action": "edit", "resource": "*", "effect": "deny" }],
    },
  },
}
```

不要移植 `tools`，无论作为顶级设置还是 agent 条目别名。旧版加载器已将工具布尔值转换为权限规则，包括将相邻写入工具名称合并到 `edit`；v2 应避免继续保留这种有损兼容输入。

将旧版 `permission` 重命名为 `permissions`，并公开已经由 `PermissionV2.Ruleset` 建模的规范化有序规则集。除 `"allow"` 和 `"deny"` 外，规则还保留交互式 `"ask"` Effect；这与 `experimental.policies` 不同，后者的提供商执行目前只需要 allow/deny 决策。未来 `agents` 条目内部应使用同样的 `permissions` 规则集结构。

```jsonc
{
  "permissions": [
    { "action": "bash", "resource": "*", "effect": "ask" },
    { "action": "bash", "resource": "git status", "effect": "allow" },
  ],
}
```

## 第 9 组：集成

外部协议和服务器集成配置。

| 字段  | 当前用途                 | 状态     | 说明                                                                                                                            |
| ----- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `mcp` | MCP 服务器定义和启用状态 | redesign | 保留 miaopan-code 的显式本地/远程服务器条目格式，嵌套在 `mcp.servers` 下；对不活动条目使用 `disabled`，并将超时默认值移到此处。 |

保留 miaopan-code MCP 服务器条目格式，而不是采用常见的 `mcpServers` 复制/粘贴结构。本地服务器仍是显式 `type: "local"` 条目，带有命令数组和 `environment`；远程服务器仍是显式 `type: "remote"` 条目，带有 `url`、`headers` 和可选 `oauth`。将服务器 map 嵌套在 `mcp.servers` 下，使超时默认值等协议级设置可以位于同一子系统中。

MCP 超时分为启动和请求预算，以毫秒表示。`startup` 覆盖建立传输和完成 MCP 初始化。`request` 独立应用于初始化后的每个 MCP 请求。服务器可以覆盖任一默认值，而无需重复另一个默认值。

```jsonc
{
  "mcp": {
    "timeout": { "startup": 30000, "request": 300000 },
    "servers": {
      "github": {
        "type": "local",
        "command": ["npx", "-y", "@github/github-mcp-server"],
        "environment": { "GITHUB_TOKEN": "{env:GITHUB_TOKEN}" },
        "disabled": false,
        "timeout": { "startup": 60000 },
      },
      "docs": {
        "type": "remote",
        "url": "https://docs.example.com/mcp",
        "headers": { "Authorization": "Bearer {env:DOCS_TOKEN}" },
        "oauth": {
          "client_id": "{env:MCP_CLIENT_ID}",
          "client_secret": "{env:MCP_CLIENT_SECRET}",
          "scope": "read write",
          "callback_port": 19876,
          "redirect_uri": "http://127.0.0.1:19876/mcp/oauth/callback",
        },
        "disabled": false,
        "timeout": { "request": 600000 },
      },
    },
  },
}
```

## 第 10 组：对话生命周期

影响长时间运行的对话和 context 管理的行为。

| 字段         | 当前用途                          | 状态     | 说明                                                                       |
| ------------ | --------------------------------- | -------- | -------------------------------------------------------------------------- |
| `compaction` | 自动压缩、修剪和 context 预留设置 | redesign | 将逐字保留的历史记录分组到 `keep` 下，并将 context 余量重命名为 `buffer`。 |

保留压缩能力，但重新设计含义不够清晰的限制。`keep.tokens` 是序列化到文本压缩检查点中的近期历史记录 token 预算。`buffer` 是预留的 token 余量，使自动压缩在输入窗口耗尽前触发。

```jsonc
{
  "compaction": {
    "auto": true,
    "prune": true,
    "keep": {
      "tokens": 2000,
    },
    "buffer": 10000,
  },
}
```

## 第 11 组：弃用与实验性设置

不应因惯性而移植的字段；每个字段都需要明确理由。

| 字段                                 | 当前用途                   | 状态     | 说明                                                                                        |
| ------------------------------------ | -------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `layout`                             | 旧版布局选择               | remove   | 不移植已弃用选项；始终使用 stretch 布局。                                                   |
| `experimental.disable_paste_summary` | 禁用粘贴内容摘要行为       | remove   | 不移植；粘贴输入呈现行为属于客户端/UI 接口。                                                |
| `experimental.batch_tool`            | 启用批处理工具             | remove   | 不移植；批处理工具不再是受支持功能。                                                        |
| `experimental.openTelemetry`         | 启用 AI SDK 遥测 span      | remove   | 不移植；可观测性属于进程级，应使用标准 OpenTelemetry 环境或声明式配置。                     |
| `experimental.primary_tools`         | 将工具限制为 primary agent | remove   | 不移植过时的 gating；agent 工具访问通过权限配置。                                           |
| `experimental.continue_loop_on_deny` | 工具调用被拒后继续循环     | remove   | 不移植旧版工具拒绝循环行为。                                                                |
| `experimental.mcp_timeout`           | MCP 请求超时               | redesign | 将默认值移到 `mcp.timeout.request`，每服务器覆盖移到 `mcp.servers.<name>.timeout.request`。 |

## 评审顺序

除非决策之间出现明确依赖，否则按以下顺序处理各组：

1. 文件元数据
2. 进程与服务器设置
3. 提供商与模型选择
4. 命令与项目资源
5. 插件
6. 文件系统与工具运行时
7. 共享与身份
8. Agent 与权限
9. 集成
10. 对话生命周期
11. 弃用与实验性设置
