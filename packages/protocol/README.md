# @miaopan-code/protocol

语言版本：简体中文 · [English](README.en.md)

`@miaopan-code/protocol` 包含用于生成 SDK 的公共 Protocol 和 Server `HttpApi` 类型路由组。依赖关系应保持为 Schema → Core/Protocol → Server；协议字段和路由标识必须稳定，用户可见描述应在适用时使用共享 i18n 资源。

该包仅供工作区内部使用。修改后请在本目录执行 `bun typecheck`；公共 API 变更后运行 `./packages/sdk/js/script/build.ts` 重新生成 JavaScript SDK。
