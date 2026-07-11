# miaopan-code

语言版本：简体中文 · [English](README.en.md)

`miaopan-code` 是一个可本地运行的开源 AI 编程助手。

## 安装

从 [GitHub Releases](https://github.com/miaopan607/miaopan-code/releases) 下载与平台匹配的 CLI 压缩包，或从源码构建：

```bash
bun install
bun --cwd packages/miaopan-code run build
```

## 文档与支持

运行 `miaopan-code --help` 查看 CLI 命令；`miaopan-code serve` 启动 API Server，默认行为进入 TUI。
问题和功能请求请提交到 [GitHub Issues](https://github.com/miaopan607/miaopan-code/issues)。

## 语言

默认使用简体中文。可在全局 `miaopan-code.jsonc`（或 `miaopan-code.json`）中设置：

```jsonc
{
  "language": "zh-CN", // 也可设为 "en"
}
```

TUI 中输入 `/language` 可打开语言选择器；确认后会立即更新界面，并将选择写入全局配置。

## 许可证与来源

本项目采用 MIT 许可证。派生来源和原始署名见 [NOTICE](NOTICE)。
