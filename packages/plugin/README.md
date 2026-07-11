# @miaopan/plugin

语言版本：简体中文 · [English](README.en.md)

`@miaopan/plugin` 提供 miaopan-code 插件使用的公共插件类型、工具辅助函数和 TUI 扩展契约。

- Promise 插件 API：[文档](src/v2/promise/README.md)
- Effect 插件 API：[文档](src/v2/effect/README.md)
- 工具辅助函数：从 `@miaopan/plugin/tool` 导入
- TUI 契约：从 `@miaopan/plugin/tui` 导入

协议标识、Hook 名称和命令名属于稳定值，不应翻译。插件提供的自然语言标签与说明应根据语言选择自己的 locale 资源，不要在运行时代码中固定单一语言。
