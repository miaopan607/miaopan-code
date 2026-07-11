# OpenAPI 描述清理计划

语言版本：简体中文 · [English](openapi-translation-cleanup.en.md)

目标是让 OpenAPI 生成结果直接反映 `HttpApi` 路由声明，避免 SDK 或 `/doc` 宣传运行时不接受的参数。运行时路由 Schema 是参数、请求体和响应的唯一事实来源；生成文档、SDK 类型与运行时校验必须保持一致。

清理应按类别逐步进行，并为每类改动保留兼容性检查。优先使用端点或 Schema 注解，避免在生成后重写规范；任何 SDK 破坏性变更都需要明确的版本迁移计划。

当前计划包括：补充 OpenAPI/运行时查询漂移测试，移除对所有 instance 路由注入 `directory`/`workspace` 的逻辑，并将后续查询覆盖、路径模式、错误结构、认证和组件形状清理拆分为独立变更。完整检查清单请参阅 [英文计划](openapi-translation-cleanup.en.md)。
