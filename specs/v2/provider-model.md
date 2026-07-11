# Provider 与 Model Catalog

语言版本：简体中文 · [English](provider-model.en.md)

Provider ID、Model ID 和能力描述构成 Catalog 的稳定身份；运行时模型还包含路由、协议、传输、认证和默认值。持久化配置只保存可序列化身份，执行能力需在应用边界解析，不依赖全局注册表。

新增 Provider 时保持 Schema、路由和能力字段兼容；代码中的 Provider/Model 标识保持原样。完整 Schema 与解析规则请参阅 [英文规范](provider-model.en.md)。
