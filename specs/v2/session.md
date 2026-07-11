# Session API

语言版本：简体中文 · [English](session.en.md)

V2 将提示持久化与模型执行分离：`sessions.prompt` 先写入 durable inbox，再按 `delivery` 和 `resume` 规则唤醒执行器。会话 ID 可复用并保持同一身份；提示消息 ID 仅在 Session、提示内容和投递模式完全匹配时允许精确重试。

Session Runner 按安全边界提升输入、重载投影历史并继续 Provider turn；steer 默认在下一安全边界提升，queue 在会话即将空闲时提升。完整状态机、恢复和并发约束请参阅 [英文规范](session.en.md)。
