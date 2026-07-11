export const Language = ["zh-CN", "en"] as const
export type Language = (typeof Language)[number]

export const messages = {
  "llm.example.current_weather": { "zh-CN": "获取当前天气", en: "Get current weather" },
  "llm.example.lookup": { "zh-CN": "查询信息", en: "Look something up" },
  "llm.generate_object.tool_description": {
    "zh-CN": "请调用此工具返回结构化结果。",
    en: "Return the structured result by calling this tool.",
  },
  "llm.generate_object.tool_not_called": {
    "zh-CN": "generateObject：模型未调用强制工具 `{{name}}`",
    en: "generateObject: model did not call the forced `{{name}}` tool",
  },
  "llm.generate_object.decode_failed": {
    "zh-CN": "generateObject：工具输入无法按 schema 解码：{{error}}",
    en: "generateObject: tool input failed schema decode: {{error}}",
  },
  "llm.tool.unknown": { "zh-CN": "未知工具：{{name}}", en: "Unknown tool: {{name}}" },
  "llm.tool.no_execute_handler": {
    "zh-CN": "工具没有执行处理器：{{name}}",
    en: "Tool has no execute handler: {{name}}",
  },
  "llm.tool.invalid_input": { "zh-CN": "工具输入无效：{{error}}", en: "Invalid tool input: {{error}}" },
  "llm.tool.invalid_success_value": {
    "zh-CN": "工具返回的值不符合成功结果 schema：{{error}}",
    en: "Tool returned an invalid value for its success schema: {{error}}",
  },
  "llm.route.provider_required": {
    "zh-CN": "Route.model({{route}}) 需要提供商",
    en: "Route.model({{route}}) requires a provider",
  },
  "llm.route.base_url_required": {
    "zh-CN": "Route.model({{route}}) 需要端点 baseURL——请先在路由上配置",
    en: "Route.model({{route}}) requires an endpoint baseURL — configure it on the route first",
  },
  "llm.route.invalid_stream_event": {
    "zh-CN": "无效的 {{route}} 流事件",
    en: "Invalid {{route}} stream event",
  },
  "llm.route.stream_read_failed": {
    "zh-CN": "读取 {{route}} 流失败",
    en: "Failed to read {{route}} stream",
  },
  "llm.transport.http_failed": { "zh-CN": "HTTP 传输失败", en: "HTTP transport failed" },
  "llm.transport.http_failed_kind": {
    "zh-CN": "HTTP 传输失败：{{kind}}",
    en: "HTTP transport failed: {{kind}}",
  },
  "llm.transport.timeout": { "zh-CN": "HTTP 传输超时：{{error}}", en: "{{error}}" },
  "llm.transport.http_error": { "zh-CN": "HTTP 传输失败：{{error}}", en: "{{error}}" },
  "llm.websocket.closed_before_opening_state": {
    "zh-CN": "WebSocket 在打开前已关闭（状态 {{state}}）",
    en: "WebSocket closed before opening (state {{state}})",
  },
  "llm.websocket.open_failed": {
    "zh-CN": "打开 WebSocket 失败：{{error}}",
    en: "Failed to open WebSocket: {{error}}",
  },
  "llm.websocket.closed_before_opening_code": {
    "zh-CN": "WebSocket 在打开前以代码 {{code}} 关闭",
    en: "WebSocket closed before opening with code {{code}}",
  },
  "llm.websocket.protocol_unsupported": {
    "zh-CN": "不支持的 WebSocket URL 协议 {{protocol}}",
    en: "Unsupported WebSocket URL protocol {{protocol}}",
  },
  "llm.websocket.url_invalid_detail": {
    "zh-CN": "无效的 WebSocket URL：{{error}}",
    en: "Invalid WebSocket URL: {{error}}",
  },
  "llm.websocket.construct_failed": { "zh-CN": "构造 WebSocket 失败", en: "Failed to construct WebSocket" },
  "llm.websocket.construct_failed_detail": {
    "zh-CN": "构造 WebSocket 失败：{{error}}",
    en: "{{error}}",
  },
  "llm.websocket.payload_unsupported": {
    "zh-CN": "不支持的 WebSocket 消息载荷",
    en: "Unsupported WebSocket message payload",
  },
  "llm.websocket.error": { "zh-CN": "WebSocket 错误：{{error}}", en: "WebSocket error: {{error}}" },
  "llm.websocket.closed_code": {
    "zh-CN": "WebSocket 以代码 {{code}} 关闭",
    en: "WebSocket closed with code {{code}}",
  },
  "llm.websocket.send_failed": {
    "zh-CN": "发送 WebSocket 消息失败",
    en: "Failed to send WebSocket message",
  },
  "llm.websocket.send_failed_detail": {
    "zh-CN": "发送 WebSocket 消息失败：{{error}}",
    en: "{{error}}",
  },
  "llm.websocket.service_required": {
    "zh-CN": "WebSocket JSON 传输需要 WebSocketExecutor.Service",
    en: "WebSocket JSON transport requires WebSocketExecutor.Service",
  },
  "llm.auth.missing_credential": {
    "zh-CN": "缺少身份验证凭据：{{source}}",
    en: "Missing auth credential: {{source}}",
  },
  "llm.auth.config_failed": {
    "zh-CN": "解析身份验证配置失败：{{error}}",
    en: "Failed to resolve auth config: {{error}}",
  },
  "llm.auth.source_value": { "zh-CN": "显式值", en: "value" },
  "llm.auth.source_optional_value": { "zh-CN": "可选值", en: "optional value" },
  "llm.openai_chat.reasoning_effort_unsupported": {
    "zh-CN": "OpenAI Chat 不支持推理强度 {{effort}}",
    en: "OpenAI Chat does not support reasoning effort {{effort}}",
  },
  "llm.openai_responses.reasoning_effort_unsupported": {
    "zh-CN": "OpenAI Responses 不支持推理强度 {{effort}}",
    en: "OpenAI Responses does not support reasoning effort {{effort}}",
  },
  "llm.anthropic.server_tool_result_unknown": {
    "zh-CN": "Anthropic Messages 不知道如何往返转换服务器工具 {{name}} 的结果",
    en: "Anthropic Messages does not know how to round-trip server tool result for {{name}}",
  },
  "llm.anthropic.system_split_tool_result": {
    "zh-CN": "Anthropic Messages 系统更新不能拆分本地工具调用及其工具结果",
    en: "Anthropic Messages system updates cannot split a local tool call from its tool result",
  },
  "llm.anthropic.assistant_content_unsupported": {
    "zh-CN": "Anthropic Messages 助手消息目前只支持文本、推理和工具调用内容",
    en: "Anthropic Messages assistant messages only support text, reasoning, and tool-call content for now",
  },
  "llm.anthropic.thinking_budget_required": {
    "zh-CN": "Anthropic thinking 提供商选项需要 budgetTokens",
    en: "Anthropic thinking provider option requires budgetTokens",
  },
  "llm.anthropic.cache_breakpoints_dropped": {
    "zh-CN": "Anthropic Messages：已丢弃 {{dropped}} 个缓存断点；API 每个请求最多允许 {{maximum}} 个。",
    en: "Anthropic Messages: dropped {{dropped}} cache breakpoint(s); the API allows at most {{maximum}} per request.",
  },
  "llm.bedrock.cache_breakpoints_dropped": {
    "zh-CN": "Bedrock Converse：已丢弃 {{dropped}} 个缓存断点；API 每个请求最多允许 {{maximum}} 个。",
    en: "Bedrock Converse: dropped {{dropped}} cache breakpoint(s); the API allows at most {{maximum}} per request.",
  },
  "llm.cloudflare.account_required": {
    "zh-CN": "{{provider}}.configure 在未提供 baseURL 时需要 accountId",
    en: "{{provider}}.configure requires accountId unless baseURL is supplied",
  },
  "llm.schema.decode_failed": {
    "zh-CN": "请求数据不符合 schema：{{error}}",
    en: "Request payload failed schema validation: {{error}}",
  },
  "llm.request.no_route": {
    "zh-CN": "{{provider}}/{{model}} 没有使用 {{route}} 的 LLM 路由",
    en: "No LLM route for {{provider}}/{{model}} using {{route}}",
  },
  "llm.endpoint.url_invalid": {
    "zh-CN": "无效的端点 URL：{{url}}",
    en: "Invalid endpoint URL: {{url}}",
  },
  "llm.stream.ended_without_finish": {
    "zh-CN": "提供商流已结束，但没有终止完成事件",
    en: "Provider stream ended without a terminal finish event",
  },
  "llm.stream.unknown_error": { "zh-CN": "未知流错误", en: "Unknown stream error" },
  "llm.tool_call.invalid_json": {
    "zh-CN": "{{route}} 工具调用 {{name}} 的 JSON 输入无效",
    en: "Invalid JSON input for {{route}} tool call {{name}}",
  },
  "llm.tool_call.name_required": {
    "zh-CN": "{{route}} 的工具选择需要工具名称",
    en: "{{route}} tool choice requires a tool name",
  },
  "llm.tool_call.delta_missing": {
    "zh-CN": "{{route}} 工具参数增量缺少对应的工具调用",
    en: "{{route}} tool argument delta is missing its tool call",
  },
  "llm.tool_call.id_or_name_missing": {
    "zh-CN": "{{route}} 工具调用增量缺少 id 或名称",
    en: "{{route}} tool call delta is missing id or name",
  },
  "llm.content.unsupported": {
    "zh-CN": "{{route}} 的 {{role}} 消息目前只支持{{types}}内容",
    en: "{{route}} {{role}} messages only support {{types}} content for now",
  },
  "llm.content.type_text": { "zh-CN": "文本", en: "text" },
  "llm.content.type_media": { "zh-CN": "媒体", en: "media" },
  "llm.content.type_reasoning": { "zh-CN": "推理", en: "reasoning" },
  "llm.content.type_tool_call": { "zh-CN": "工具调用", en: "tool-call" },
  "llm.content.type_tool_result": { "zh-CN": "工具结果", en: "tool-result" },
  "llm.content.list_two": { "zh-CN": "{{first}}和{{second}}", en: "{{first}} and {{second}}" },
  "llm.content.list_many": {
    "zh-CN": "{{head}}和{{last}}",
    en: "{{head}}, and {{last}}",
  },
  "llm.media.type_unsupported": {
    "zh-CN": "{{route}} 不支持媒体类型 {{mediaType}}",
    en: "{{route}} does not support media type {{mediaType}}",
  },
  "llm.media.image_type_unsupported": {
    "zh-CN": "{{route}} 不支持图像媒体类型 {{mediaType}}",
    en: "{{route}} does not support image media type {{mediaType}}",
  },
  "llm.media.decoded_limit_exceeded": {
    "zh-CN": "{{route}} 媒体超过 {{bytes}} 字节的解码后大小限制",
    en: "{{route}} media exceeds the {{bytes}} byte decoded limit",
  },
  "llm.media.encoded_limit_exceeded": {
    "zh-CN": "{{route}} 媒体超过 {{bytes}} 字节的编码后大小限制",
    en: "{{route}} media exceeds the {{bytes}} byte encoded limit",
  },
  "llm.media.data_url_invalid_base64": {
    "zh-CN": "{{route}} 媒体 data URL 必须包含有效的 base64",
    en: "{{route}} media data URL must contain valid base64",
  },
  "llm.media.type_mismatch": {
    "zh-CN": "{{route}} 媒体类型 {{mediaType}} 与 data URL 类型 {{dataUrlType}} 不匹配",
    en: "{{route}} media type {{mediaType}} does not match data URL type {{dataUrlType}}",
  },
  "llm.media.invalid_base64": {
    "zh-CN": "{{route}} 媒体必须包含有效的 base64",
    en: "{{route}} media must contain valid base64",
  },
  "llm.media.noncanonical_base64": {
    "zh-CN": "{{route}} 媒体必须包含规范形式的 base64",
    en: "{{route}} media must contain canonical base64",
  },
  "llm.http.body_overlay_forbidden": {
    "zh-CN": "http.body 不能覆盖协议拥有的字段：{{fields}}",
    en: "http.body cannot overlay protocol-owned field(s): {{fields}}",
  },
  "llm.http.body_overlay_object_only": {
    "zh-CN": "http.body 只能覆盖 JSON 对象请求体",
    en: "http.body can only overlay JSON object request bodies",
  },
  "llm.http.provider_failed": {
    "zh-CN": "提供商请求失败，HTTP 状态码为 {{status}}",
    en: "Provider request failed with HTTP {{status}}",
  },
  "llm.http.provider_failed_body": {
    "zh-CN": "提供商请求失败，HTTP 状态码为 {{status}}：{{body}}",
    en: "Provider request failed with HTTP {{status}}: {{body}}",
  },
  "llm.bedrock.event_frame_decode_failed": {
    "zh-CN": "解码 Bedrock Converse event-stream 帧失败：{{error}}",
    en: "Failed to decode Bedrock Converse event-stream frame: {{error}}",
  },
  "llm.bedrock.event_payload_parse_failed": {
    "zh-CN": "解析 Bedrock Converse event-stream 载荷失败",
    en: "Failed to parse Bedrock Converse event-stream payload",
  },
  "llm.bedrock.sigv4_failed": {
    "zh-CN": "Bedrock Converse SigV4 签名失败：{{error}}",
    en: "Bedrock Converse SigV4 signing failed: {{error}}",
  },
  "llm.bedrock.auth_required": {
    "zh-CN": "Bedrock Converse 需要路由 bearer 身份验证或路由上配置的 AWS 凭据",
    en: "Bedrock Converse requires either route bearer auth or AWS credentials configured on the route",
  },
  "llm.bedrock.tool_result_image_only": {
    "zh-CN": "Bedrock Converse 的工具结果只支持图像媒体",
    en: "Bedrock Converse only supports image media in tool results",
  },
  "llm.bedrock.default_document_name": {
    "zh-CN": "文档.{{format}}",
    en: "document.{{format}}",
  },
  "llm.bedrock.stream_error": {
    "zh-CN": "Bedrock Converse 流错误",
    en: "Bedrock Converse stream error",
  },
  "llm.bedrock.error": { "zh-CN": "Bedrock Converse 错误", en: "Bedrock Converse error" },
  "llm.anthropic.stream_error": {
    "zh-CN": "Anthropic Messages 流错误",
    en: "Anthropic Messages stream error",
  },
  "llm.openai_responses.response_failed": {
    "zh-CN": "OpenAI Responses 响应失败",
    en: "OpenAI Responses response failed",
  },
  "llm.openai_responses.stream_error": {
    "zh-CN": "OpenAI Responses 流错误",
    en: "OpenAI Responses stream error",
  },
  "llm.openai_responses.websocket_body_object": {
    "zh-CN": "OpenAI Responses WebSocket 请求体必须是 JSON 对象",
    en: "OpenAI Responses WebSocket body must be a JSON object",
  },
} as const

export type MessageKey = keyof typeof messages
export type MessageParameters = Record<string, string | number | undefined>

export function resolveLanguage(input: unknown): Language {
  return input === "en" ? "en" : "zh-CN"
}

export function t(language: Language | undefined, key: MessageKey, parameters: MessageParameters = {}): string {
  return messages[key][resolveLanguage(language)].replace(/{{(\w+)}}/g, (_, name: string) =>
    String(parameters[name] ?? ""),
  )
}
