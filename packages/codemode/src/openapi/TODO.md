# OpenAPI 后续工作

语言版本：[简体中文](TODO.md) · [English](TODO.en.md)

CodeMode 的 OpenAPI 适配器会跳过当前无法正确执行的操作。后续工作包括：

- Cookie 参数、认证和 Cookie Header 合并；
- 各种参数序列化格式、外部引用和嵌套 `$defs`；
- 模板 Server URL、查询字符串/片段基础 URL；
- 响应 Schema 校验、内容协商、二进制和流式传输；
- 响应投影（`readOnly`/`writeOnly`）、重定向策略和请求/响应大小限制；
- JSON 响应的 UTF-8/空响应体校验，以及更完整的安全方案组合校验。

完整清单和实现边界请参阅 [英文后续工作文档](TODO.en.md)。协议字段、Schema 名称和代码标识保持原样。
