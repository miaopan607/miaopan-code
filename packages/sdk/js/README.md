# @miaopan/sdk

语言版本：简体中文 · [English](README.en.md)

JavaScript SDK 根据公开 Protocol 和 Server `HttpApi` 定义生成，提供旧版 API 与 V2 API 的类型安全客户端。`src/gen` 和 `src/v2/gen` 下的生成文件不可手动编辑。

修改公共 Protocol 或 Server `HttpApi` 后，请执行：

```bash
./packages/sdk/js/script/build.ts
```

生成的 SDK 与 Core、Server 保持独立。兼容性要求请参阅 [中文贡献指南](../../../CONTRIBUTING.md) 和 [规范索引](../../../specs/README.md)。协议字段、端点名称和类型标识保持原样。

## 语言

SDK 客户端与服务器启动器自身生成的错误默认使用简体中文。向 `createMiaopanCodeClient`、`createMiaopanCodeServer` 或 `createMiaopanCode` 传入 `language: "en"` 可切换为英文；服务器响应正文仍使用服务器选择的语言。
