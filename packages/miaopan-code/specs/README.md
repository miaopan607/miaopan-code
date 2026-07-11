# miaopan-code 设计规范 / Specifications

语言版本：[简体中文说明](README.md) · [English](../../../README.en.md)

本目录记录 miaopan-code 运行时、Effect 迁移、V2 API 和 TUI 插件的设计。规范默认使用简体中文，英文翻译放在对应的 `.en.md` 文件中；协议字段和代码标识保持原样。

## 主题索引

- **Effect 运行时**：`effect/guide.md`（迁移指南）、`effect/server-package.md`（Server 包）、`effect/routes.md`（路由）、`effect/schema.md`（Schema）、`effect/tools.md`（工具）、`effect/errors.md`（错误边界）。
- **V2 API 与 TUI**：`v2/api.ts`、`v2/message-shape.md`、`v2/notifications.md`、`v2/tui-command-shim.md`。
- **插件与兼容性**：`tui-plugins.md`、`openapi-translation-cleanup.md`。

新增英文翻译时，请在同目录创建对应 `.en.md` 文件，并在中文原文顶部添加互相链接；翻译不得改变设计语义。
