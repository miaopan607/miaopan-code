# 为 miaopan-code 做贡献

语言：简体中文 · [English](CONTRIBUTING.en.md)

项目界面默认使用简体中文，同时也支持英文。可以在全局 `miaopan-code.jsonc` 中设置
`"language": "en"`（或 `"zh-CN"`），也可以在 TUI 中使用 `/language`。
贡献代码时，请将面向用户的字符串放在现有 i18n key 后面；不要在代码中添加特定语言的字面量。

我们希望让你能够轻松地为 miaopan-code 做贡献。以下是最常被合并的改动类型：

- Bug 修复
- 增加 LSP / 格式化工具
- 改进 LLM 性能
- 支持新的提供商
- 修复特定环境中的特殊问题
- 补齐缺失的标准行为
- 改进文档

不过，任何 UI 或核心产品功能都必须在实现前经过核心团队的设计评审。

如果你不确定某个 PR 是否会被接受，可以随时询问维护者，或者查找带有以下任一标签的 issue：

- [`help wanted`](https://github.com/miaopan607/miaopan-code/issues?q=is%3Aissue%20state%3Aopen%20label%3Ahelp-wanted)
- [`good first issue`](https://github.com/miaopan607/miaopan-code/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22)
- [`bug`](https://github.com/miaopan607/miaopan-code/issues?q=is%3Aissue%20state%3Aopen%20label%3Abug)
- [`perf`](https://github.com/miaopan607/miaopan-code/issues?q=is%3Aopen%20is%3Aissue%20label%3A%22perf%22)

> [!NOTE]
> 忽略这些约束的 PR 很可能会被关闭。

想处理某个 issue？请留下评论；如果它不是我们已经在做的事项，维护者可能会将其分配给你。

## 添加新提供商

新提供商不应该需要大量代码改动。请向此仓库提交提供商支持相关改动。

## 开发 miaopan-code

- 要求：Bun 1.3+
- 在仓库根目录安装依赖并启动开发服务器：

  ```bash
  bun install
  bun dev
  ```

### 针对其他目录运行

默认情况下，`bun dev` 会在 `packages/miaopan-code` 目录中运行 miaopan-code。若要针对其他目录或仓库运行：

```bash
bun dev <directory>
```

若要针对 miaopan-code 仓库根目录本身运行 miaopan-code：

```bash
bun dev .
```

### 构建“localcode”

若要编译独立可执行文件：

```bash
./packages/miaopan-code/script/build.ts --single
```

然后通过以下命令运行：

```bash
./packages/miaopan-code/dist/miaopan-code-<platform>/bin/miaopan-code
```

请将 `<platform>` 替换为你的平台（例如 `darwin-arm64`、`linux-x64`）。

- 核心组成：
  - `packages/miaopan-code`：miaopan-code 核心业务逻辑和服务器。
  - `packages/miaopan-code/src/cli/cmd/tui/`：TUI 代码，使用 SolidJS 和 [opentui](https://github.com/sst/opentui) 编写。
  - `packages/tui`：终端 UI，使用 SolidJS 和 [opentui](https://github.com/sst/opentui) 编写。
  - `packages/plugin`：`@miaopan-code/plugin` 的源代码。

### 理解 bun dev 与 miaopan-code

开发期间，`bun dev` 是已构建 `miaopan-code` 命令的本地等价命令。二者运行相同的 CLI 界面：

```bash
# 开发环境（从项目根目录运行）
bun dev --help           # 显示所有可用命令
bun dev serve            # 启动无界面 API 服务器
bun dev <directory>      # 在指定目录中启动 TUI

# 生产环境
miaopan-code --help          # 显示所有可用命令
miaopan-code serve           # 启动无界面 API 服务器
miaopan-code <directory>     # 在指定目录中启动 TUI
```

### 运行 API 服务器

若要启动 miaopan-code 无界面 API 服务器：

```bash
bun dev serve
```

默认情况下，这会在 4096 端口启动无界面服务器。你可以指定其他端口：

```bash
bun dev serve --port 8080
```

> [!NOTE]
> 如果你修改了公共 API，请使用 `./packages/sdk/js/script/build.ts` 重新生成旧版 SDK。

请尽量遵循[风格指南](./AGENTS.md)。

### 设置调试器

Bun 调试目前仍有一些不够完善的地方。希望本指南能帮助你完成设置并避开一些痛点。

调试 miaopan-code 最可靠的方法，是在终端中通过 `bun run --inspect=<url> dev ...` 手动运行，并让调试器通过该 URL 连接。其他方法可能导致断点映射错误，至少在 VSCode 中如此（你的情况可能有所不同）。

注意事项：

- 如果你想运行 miaopan-code TUI，并让服务器代码中的断点触发，可能需要使用 `bun dev spawn`，而不是通常的 `bun dev`。这是因为 `bun dev` 在工作线程中运行服务器，断点在那里可能无法正常工作。
- 如果 `spawn` 不适用于你，可以分别调试服务器：
  - 调试服务器：`bun run --inspect=ws://localhost:6499/ --cwd packages/miaopan-code ./src/index.ts serve --port 4096`，
    然后使用 `miaopan-code attach http://localhost:4096` 连接 TUI。
  - 调试 TUI：`bun run --inspect=ws://localhost:6499/ --cwd packages/miaopan-code --conditions=browser ./src/index.ts`。

其他提示和技巧：

- 根据你的工作流，你可能想使用 `--inspect-wait` 或 `--inspect-brk`，而不是 `--inspect`。
- 每次调用都指定 `--inspect=ws://localhost:6499/` 会很麻烦；你可以改为执行 `export BUN_OPTIONS=--inspect=ws://localhost:6499/`。

#### VSCode 设置

如果你使用 VSCode，可以采用我们的示例配置 [.vscode/settings.example.json](.vscode/settings.example.json) 和 [.vscode/launch.example.json](.vscode/launch.example.json)。

以下调试方法可能存在问题：

- 使用 `"request": "launch"` 的调试配置可能会错误映射断点，从而无法使用。
- 在 VSCode `JavaScript Debug Terminal` 中运行 miaopan-code 时也会出现相同问题。

不过，你仍可以尝试这些方法，因为它们可能适用于你的环境。

## Pull Request 要求

### Issue 优先政策

**所有 PR 都必须引用现有 issue。** 在打开 PR 前，请先创建 issue，描述该 bug 或功能。这有助于维护者分类处理，并防止重复工作。没有链接 issue 的 PR 可能未经审查就被关闭。

- 在 PR 描述中使用 `Fixes #123` 或 `Closes #123` 链接 issue。
- 对于小修复，简短的 issue 即可——只需提供足够的上下文，让维护者理解问题。

### 一般要求

- 保持 Pull Request 小而专注。
- 解释问题，以及你的改动为何能修复它。
- 添加新功能前，确保代码库中其他位置尚未存在该功能。

### UI 改动

如果你的 PR 包含 UI 改动，请提供改动前后的截图或视频。这能帮助维护者更快评审，也能让你更快收到反馈。

### 逻辑改动

对于非 UI 改动（bug 修复、新功能、重构），请说明**你如何验证它可以正常工作**：

- 你测试了什么？
- 评审者如何复现或确认该修复？

### 禁止 AI 生成的文字墙

冗长、由 AI 生成的 PR 描述和 issue 不可接受，并可能被忽略。请尊重维护者的时间：

- 描述要简短、聚焦。
- 用你自己的话解释改了什么以及为什么改。
- 如果你无法简要说明，你的 PR 可能过大。

### PR 标题

PR 标题应遵循 conventional commit 标准：

- `feat:` 新功能
- `fix:` bug 修复
- `docs:` 文档或 README 改动
- `chore:` 维护任务、依赖更新等
- `refactor:` 不改变行为的代码重构
- `test:` 添加或更新测试

你也可以选择添加 scope，说明受影响的包：

- `feat(tui):` TUI 包中的功能
- `chore(miaopan-code):` miaopan-code 包中的维护工作

示例：

- `docs: update contributing guidelines`
- `fix: resolve crash on startup`
- `feat: add dark mode support`
- `feat(app): add dark mode support`
- `fix(tui): resolve terminal startup crash`
- `chore: bump dependency versions`

### 风格偏好

这些规则不会被严格强制执行，只是一般性指南：

- **函数：** 除非拆分能带来明确的复用或组合收益，否则将逻辑保留在一个函数内。
- **解构：** 不要对变量进行不必要的解构。
- **控制流：** 避免使用 `else` 语句。
- **错误处理：** 可以时优先使用 `.catch(...)`，而不是 `try`/`catch`。
- **类型：** 使用精确类型，避免 `any`。
- **变量：** 坚持不可变模式，避免 `let`。
- **命名：** 在仍能清楚表达含义时，选择简洁的单词标识符。
- **运行时 API：** 适合时使用 `Bun.file()` 等 Bun 辅助方法。

## 功能请求

对于全新的功能，请先展开设计讨论。创建 issue，描述问题、你建议的方案（可选），以及它为何应纳入 miaopan-code。核心团队会协助判断是否应推进；请等待批准，不要直接创建功能 PR。

## 信任与担保系统

本项目使用 [vouch](https://github.com/mitchellh/vouch) 管理贡献者信任。担保名单维护在 [`.github/VOUCHED.td`](.github/VOUCHED.td) 中。

### 工作方式

- **已担保用户**是明确受信任的贡献者。
- **被否定用户**会被明确阻止。来自被否定用户的 issue 和 Pull Request 会被自动关闭。如果你已被否定，可以通过 [Discord](https://github.com/miaopan607/miaopan-code/discord) 联系维护者，请求取消担保状态。
- **其他所有人**都可以正常参与——创建 issue 或 PR 无需先获得担保。

### 面向维护者

拥有写入权限的协作者可以通过在任意 issue 中发表评论来管理担保名单：

- `vouch` —— 为 issue 作者担保。
- `vouch @username` —— 为指定用户担保。
- `denounce` —— 否定 issue 作者。
- `denounce @username` —— 否定指定用户。
- `denounce @username <reason>` —— 附带理由否定指定用户。
- `unvouch` / `unvouch @username` —— 将某人从名单中移除。

改动会自动提交到 `.github/VOUCHED.td`。

### 否定政策

否定仅适用于反复提交低质量 AI 生成贡献、发送垃圾信息或以其他方式表现出恶意的用户。它不用于处理意见分歧或无心之失。

## Issue 要求

所有 issue **必须**使用我们的任一 issue 模板：

- **Bug report** —— 用于报告 bug（必须提供描述）。
- **Feature request** —— 用于建议改进（必须勾选确认框并提供描述）。
- **Question** —— 用于提问（必须填写问题）。

不允许空白 issue。创建新 issue 时，自动检查会验证它是否遵循模板并符合贡献指南。如果 issue 不符合要求，你会收到说明所需修正内容的评论，并有 **2 小时**编辑 issue。之后，它会被自动关闭。

Issue 可能因以下原因被标记：

- 未使用模板
- 必填字段为空或填入占位文字
- AI 生成的文字墙
- 缺少有意义的内容

如果你认为自己的 issue 被错误标记，请告知维护者。
