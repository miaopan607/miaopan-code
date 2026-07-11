# Provider 策略

语言版本：简体中文 · [English](provider-policy.en.md)

策略决定对命名资源的操作是否允许。Provider 配置描述端点、选项和模型覆盖；Provider 策略则由 `experimental.policies` 决定某项操作是否可用，两者保持分离。

策略评估应在运行时执行，并对 Provider ID 等资源使用稳定标识。完整匹配、优先级和错误语义请参阅 [英文规范](provider-policy.en.md)。
