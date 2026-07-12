# miaopan-code

语言版本：简体中文 · [English](README.en.md)

`miaopan-code` 是一个可本地运行的开源 AI 编程助手，提供终端 TUI、非交互命令、API Server、MCP 与插件支持。

## 安装

### npm

```bash
npm install -g @miaopan/code@latest
```

也可以使用 `bun`、`pnpm` 或 `yarn` 全局安装同一个包。

### GitHub Releases

从 [GitHub Releases](https://github.com/miaopan607/miaopan-code/releases/latest) 下载与当前平台匹配的压缩包，解压后运行其中的 `miaopan-code`。

### 从源码构建

需要 Bun 1.3 或更高版本：

```bash
bun install
bun --cwd packages/miaopan-code run build
```

构建产物位于 `packages/miaopan-code/dist/`。

## 快速开始

启动当前目录的 TUI：

```bash
miaopan-code .
```

首次使用时可在 TUI 中通过 `/connect` 配置提供商，也可以使用 CLI：

```bash
miaopan-code providers login
miaopan-code models
```

指定模型启动：

```bash
miaopan-code . --model provider/model
```

## 常用方式

### 非交互运行

```bash
miaopan-code run "解释这个项目的结构"
miaopan-code run --format json "检查当前改动"
miaopan-code run --continue "继续处理"
```

`run` 还支持 `--session`、`--fork`、`--file`、`--variant`、`--thinking` 和 `--interactive`。完整参数见 `miaopan-code run --help`。

### API Server 与远程 TUI

```bash
miaopan-code serve --port 4096
miaopan-code attach http://localhost:4096
```

`attach` 支持指定远程工作目录、恢复已有会话以及基本身份验证。

### 会话管理

```bash
miaopan-code session list
miaopan-code export <sessionID> > session.json
miaopan-code import session.json
miaopan-code stats
```

交互界面和 CLI 均支持继续、分叉和恢复会话；需要导出可分享内容时，可使用 `export --sanitize` 隐藏敏感记录与文件数据。

### MCP、插件与 Agent

```bash
miaopan-code mcp add
miaopan-code mcp list
miaopan-code plugin <module>
miaopan-code agent list
miaopan-code agent create
```

TUI 内置三个可切换的主 Agent，使用 `Tab` 正向切换，使用 `Shift+Tab` 反向切换：

- `build`：默认 Agent，按照配置的权限读取、修改工作区并执行工具，适合直接完成开发任务。
- `ask`：问答 Agent，可以读取和分析工作区，但不能修改文件，适合解释代码、排查问题和回答项目相关问题。
- `plan`：规划 Agent，禁止编辑工作区，用于在实施前梳理需求、探索方案并形成执行计划。

也可以通过配置文件或 `miaopan-code agent create` 添加自定义 Agent。

## 配置

项目配置使用 `miaopan-code.jsonc` 或 `miaopan-code.json`。配置可以放在项目目录或 `.miaopan-code/` 中；全局配置目录由操作系统决定。

最小示例：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json",
  "language": "zh-CN",
  "model": "provider/model",
  "autoupdate": "notify",
}
```

文件位置、合并规则、Agent、技能、插件、MCP 和权限等详细说明请查看[配置指南](docs/configuration.md)。完整配置字段以发布产物中的 `schemas/config.json` 或仓库内的 [配置 Schema](schemas/config.json) 为准。TUI 专用配置对应 [TUI Schema](schemas/tui.json)。

## 语言

默认语言为简体中文，英文作为额外支持语言。可将 `language` 设置为 `zh-CN` 或 `en`；TUI 中也可以通过 `/language` 切换，确认后立即生效并写入全局配置。

## 开发与贡献

```bash
bun install
bun dev .
```

贡献前请阅读 [贡献指南](CONTRIBUTING.md) 和 [仓库开发约定](AGENTS.md)。问题与功能请求请提交到 [GitHub Issues](https://github.com/miaopan607/miaopan-code/issues)。

## 许可证与来源

本项目采用 MIT 许可证。派生来源和原始署名见 [NOTICE](NOTICE)。
