const messages = {
  server_timeout: {
    "zh-CN": "等待服务器启动超时（{{timeout}} 毫秒）",
    en: "Timeout waiting for server to start after {{timeout}}ms",
  },
  server_url_parse_failed: {
    "zh-CN": "无法从服务器输出中解析 URL：{{line}}",
    en: "Failed to parse server url from output: {{line}}",
  },
  server_exited: { "zh-CN": "服务器已退出，退出代码为 {{code}}", en: "Server exited with code {{code}}" },
  server_output: { "zh-CN": "服务器输出：{{output}}", en: "Server output: {{output}}" },
  client_empty_response: { "zh-CN": "（响应正文为空）", en: "(empty response body)" },
  client_network_no_response: { "zh-CN": "网络错误（无响应）", en: "network error (no response)" },
  client_server_error: {
    "zh-CN": "miaopanCode 服务器 {{request}}：{{reason}}",
    en: "miaopanCode server {{request}}: {{reason}}",
  },
  client_unsupported_server: {
    "zh-CN": "当前版本的 MiaopanCode Server 不支持此请求（服务器返回了 text/html）",
    en: "Request is not supported by this version of MiaopanCode Server (Server responded with text/html)",
  },
  build_duplicate_session_events: {
    "zh-CN": "生成的会话历史包含重复的 Session 事件变体",
    en: "Session history generated duplicate Session event variants",
  },
  build_history_types_patch_failed: {
    "zh-CN": "未能应用会话历史数值查询类型补丁",
    en: "Session history numeric query patch did not apply",
  },
  build_history_sdk_patch_failed: {
    "zh-CN": "未能应用会话历史数值查询 SDK 补丁",
    en: "Session history numeric SDK patch did not apply",
  },
  build_sse_patch_failed: {
    "zh-CN": "未能应用 SseFn 补丁；@hey-api/openapi-ts 输出可能已更改（{{path}}）",
    en: "SseFn patch did not apply; @hey-api/openapi-ts output may have changed ({{path}})",
  },
  build_sdk_docs_patch_failed: {
    "zh-CN": "未能应用生成 SDK 的 JSDoc 国际化补丁（{{path}}）",
    en: "Generated SDK JSDoc localization patch did not apply ({{path}})",
  },
  build_client_option_doc: {
    "zh-CN":
      "可以提供由 `createClient()` 返回的客户端实例，而不是逐项提供选项。如果需要实现自定义客户端，这也会很有用。",
    en: "You can provide a client instance returned by `createClient()` instead of individual options. This might be also useful if you want to implement a custom client.",
  },
  build_meta_option_doc: {
    "zh-CN": "可以通过 `meta` 对象传递任意值，用于访问未定义为 SDK 函数一部分的值。",
    en: "You can pass arbitrary values through the `meta` object. This can be used to access values that aren't defined as part of the SDK function.",
  },
  generated_query_nested_unsupported: {
    "zh-CN": "不支持深层嵌套的数组/对象。请提供自定义 `querySerializer()` 处理这些值。",
    en: "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.",
  },
  generated_sse_failed: {
    "zh-CN": "SSE 请求失败：{{status}} {{statusText}}",
    en: "SSE failed: {{status}} {{statusText}}",
  },
  generated_sse_no_body: { "zh-CN": "SSE 响应没有正文", en: "No body in SSE response" },
  generated_sdk_client_missing: {
    "zh-CN": '未找到 SDK 客户端。请使用 "new MiaopanCodeClient()" 创建客户端以修复此错误。',
    en: 'No SDK client found. Create one with "new MiaopanCodeClient()" to fix this error.',
  },
  publish_already_published: {
    "zh-CN": "已发布 {{name}}@{{version}}",
    en: "already published {{name}}@{{version}}",
  },
} as const

const legacyDocs = {
  "Global.event": { "zh-CN": "获取事件", en: "Get events" },
  "Project.list": { "zh-CN": "列出所有项目", en: "List all projects" },
  "Project.current": { "zh-CN": "获取当前项目", en: "Get the current project" },
  "Pty.list": { "zh-CN": "列出所有 PTY 会话", en: "List all PTY sessions" },
  "Pty.create": { "zh-CN": "创建新的 PTY 会话", en: "Create a new PTY session" },
  "Pty.remove": { "zh-CN": "移除 PTY 会话", en: "Remove a PTY session" },
  "Pty.get": { "zh-CN": "获取 PTY 会话信息", en: "Get PTY session info" },
  "Pty.update": { "zh-CN": "更新 PTY 会话", en: "Update PTY session" },
  "Pty.connect": { "zh-CN": "连接 PTY 会话", en: "Connect to a PTY session" },
  "Config.get": { "zh-CN": "获取配置信息", en: "Get config info" },
  "Config.update": { "zh-CN": "更新配置", en: "Update config" },
  "Config.providers": { "zh-CN": "列出所有提供商", en: "List all providers" },
  "Tool.ids": {
    "zh-CN": "列出所有工具 ID（包括内置和动态注册的工具）",
    en: "List all tool IDs (including built-in and dynamically registered)",
  },
  "Tool.list": {
    "zh-CN": "列出指定提供商/模型的工具及其 JSON Schema 参数",
    en: "List tools with JSON schema parameters for a provider/model",
  },
  "Instance.dispose": { "zh-CN": "释放当前实例", en: "Dispose the current instance" },
  "Path.get": { "zh-CN": "获取当前路径", en: "Get the current path" },
  "Vcs.get": { "zh-CN": "获取当前实例的版本控制信息", en: "Get VCS info for the current instance" },
  "Session.list": { "zh-CN": "列出所有会话", en: "List all sessions" },
  "Session.create": { "zh-CN": "创建新会话", en: "Create a new session" },
  "Session.status": { "zh-CN": "获取会话状态", en: "Get session status" },
  "Session.delete": { "zh-CN": "删除会话及其全部数据", en: "Delete a session and all its data" },
  "Session.get": { "zh-CN": "获取会话", en: "Get session" },
  "Session.update": { "zh-CN": "更新会话属性", en: "Update session properties" },
  "Session.children": { "zh-CN": "获取会话的子会话", en: "Get a session's children" },
  "Session.todo": { "zh-CN": "获取会话的待办列表", en: "Get the todo list for a session" },
  "Session.init": { "zh-CN": "分析应用并创建 AGENTS.md 文件", en: "Analyze the app and create an AGENTS.md file" },
  "Session.fork": { "zh-CN": "在指定消息处分叉现有会话", en: "Fork an existing session at a specific message" },
  "Session.abort": { "zh-CN": "中止会话", en: "Abort a session" },
  "Session.unshare": { "zh-CN": "取消共享会话", en: "Unshare the session" },
  "Session.share": { "zh-CN": "共享会话", en: "Share a session" },
  "Session.diff": { "zh-CN": "获取此会话的差异", en: "Get the diff for this session" },
  "Session.summarize": { "zh-CN": "总结会话", en: "Summarize the session" },
  "Session.messages": { "zh-CN": "列出会话消息", en: "List messages for a session" },
  "Session.prompt": { "zh-CN": "创建新消息并发送到会话", en: "Create and send a new message to a session" },
  "Session.message": { "zh-CN": "获取会话中的消息", en: "Get a message from a session" },
  "Session.promptAsync": {
    "zh-CN": "创建新消息并发送到会话，在需要时启动会话并立即返回",
    en: "Create and send a new message to a session, start if needed and return immediately",
  },
  "Session.command": { "zh-CN": "向会话发送新命令", en: "Send a new command to a session" },
  "Session.shell": { "zh-CN": "运行 shell 命令", en: "Run a shell command" },
  "Session.revert": { "zh-CN": "还原消息", en: "Revert a message" },
  "Session.unrevert": { "zh-CN": "恢复所有已还原的消息", en: "Restore all reverted messages" },
  "Command.list": { "zh-CN": "列出所有命令", en: "List all commands" },
  "Oauth.authorize": { "zh-CN": "使用 OAuth 授权提供商", en: "Authorize a provider using OAuth" },
  "Oauth.callback": { "zh-CN": "处理提供商的 OAuth 回调", en: "Handle OAuth callback for a provider" },
  "Provider.list": { "zh-CN": "列出所有提供商", en: "List all providers" },
  "Provider.auth": { "zh-CN": "获取提供商身份验证方式", en: "Get provider authentication methods" },
  "Find.text": { "zh-CN": "在文件中查找文本", en: "Find text in files" },
  "Find.files": { "zh-CN": "查找文件", en: "Find files" },
  "Find.symbols": { "zh-CN": "查找工作区符号", en: "Find workspace symbols" },
  "File.list": { "zh-CN": "列出文件和目录", en: "List files and directories" },
  "File.read": { "zh-CN": "读取文件", en: "Read a file" },
  "File.status": { "zh-CN": "获取文件状态", en: "Get file status" },
  "App.log": { "zh-CN": "向服务器日志写入日志条目", en: "Write a log entry to the server logs" },
  "App.agents": { "zh-CN": "列出所有代理", en: "List all agents" },
  "Auth.remove": { "zh-CN": "移除 MCP 服务器的 OAuth 凭据", en: "Remove OAuth credentials for an MCP server" },
  "Auth.start": {
    "zh-CN": "启动 MCP 服务器的 OAuth 身份验证流程",
    en: "Start OAuth authentication flow for an MCP server",
  },
  "Auth.callback": {
    "zh-CN": "使用授权码完成 OAuth 身份验证",
    en: "Complete OAuth authentication with authorization code",
  },
  "Auth.authenticate": {
    "zh-CN": "启动 OAuth 流程并等待回调（打开浏览器）",
    en: "Start OAuth flow and wait for callback (opens browser)",
  },
  "Auth.set": { "zh-CN": "设置身份验证凭据", en: "Set authentication credentials" },
  "Mcp.status": { "zh-CN": "获取 MCP 服务器状态", en: "Get MCP server status" },
  "Mcp.add": { "zh-CN": "动态添加 MCP 服务器", en: "Add MCP server dynamically" },
  "Mcp.connect": { "zh-CN": "连接 MCP 服务器", en: "Connect an MCP server" },
  "Mcp.disconnect": { "zh-CN": "断开 MCP 服务器连接", en: "Disconnect an MCP server" },
  "Lsp.status": { "zh-CN": "获取 LSP 服务器状态", en: "Get LSP server status" },
  "Formatter.status": { "zh-CN": "获取格式化程序状态", en: "Get formatter status" },
  "Control.next": { "zh-CN": "从队列获取下一个 TUI 请求", en: "Get the next TUI request from the queue" },
  "Control.response": { "zh-CN": "向 TUI 请求队列提交响应", en: "Submit a response to the TUI request queue" },
  "Tui.appendPrompt": { "zh-CN": "向 TUI 追加提示", en: "Append prompt to the TUI" },
  "Tui.openHelp": { "zh-CN": "打开帮助对话框", en: "Open the help dialog" },
  "Tui.openSessions": { "zh-CN": "打开会话对话框", en: "Open the session dialog" },
  "Tui.openThemes": { "zh-CN": "打开主题对话框", en: "Open the theme dialog" },
  "Tui.openModels": { "zh-CN": "打开模型对话框", en: "Open the model dialog" },
  "Tui.submitPrompt": { "zh-CN": "提交提示", en: "Submit the prompt" },
  "Tui.clearPrompt": { "zh-CN": "清除提示", en: "Clear the prompt" },
  "Tui.executeCommand": {
    "zh-CN": "执行 TUI 命令（例如 agent_cycle）",
    en: "Execute a TUI command (e.g. agent_cycle)",
  },
  "Tui.showToast": { "zh-CN": "在 TUI 中显示通知", en: "Show a toast notification in the TUI" },
  "Tui.publish": { "zh-CN": "发布 TUI 事件", en: "Publish a TUI event" },
  "Event.subscribe": { "zh-CN": "获取事件", en: "Get events" },
  "MiaopanCodeClient.postSessionIdPermissionsPermissionId": {
    "zh-CN": "响应权限请求",
    en: "Respond to a permission request",
  },
} as const

const legacyTypeDocs = {
  "common.session_id": { "zh-CN": "会话 ID", en: "Session ID" },
  "common.provider_id": { "zh-CN": "提供商 ID", en: "Provider ID" },
  "common.message_id": { "zh-CN": "消息 ID", en: "Message ID" },
  "common.duration_ms": { "zh-CN": "持续时间（毫秒）", en: "Duration in milliseconds" },
  "response.project_list": { "zh-CN": "项目列表", en: "List of projects" },
  "response.session_list": { "zh-CN": "会话列表", en: "List of sessions" },
  "response.children_list": { "zh-CN": "子会话列表", en: "List of children" },
  "response.diff_list": { "zh-CN": "差异列表", en: "List of diffs" },
  "response.message_list": { "zh-CN": "消息列表", en: "List of messages" },
  "response.command_list": { "zh-CN": "命令列表", en: "List of commands" },
  "response.provider_list": { "zh-CN": "提供商列表", en: "List of providers" },
  "response.agent_list": { "zh-CN": "代理列表", en: "List of agents" },
  "todo.description": { "zh-CN": "任务的简要描述", en: "Brief description of the task" },
  "todo.status": {
    "zh-CN": "任务当前状态：pending、in_progress、completed、cancelled",
    en: "Current status of the task: pending, in_progress, completed, cancelled",
  },
  "todo.priority": { "zh-CN": "任务优先级：high、medium、low", en: "Priority level of the task: high, medium, low" },
  "todo.id": { "zh-CN": "待办事项的唯一标识符", en: "Unique identifier for the todo item" },
  "keybind.config": { "zh-CN": "自定义快捷键配置", en: "Custom keybind configurations" },
  "keybind.leader": { "zh-CN": "快捷键组合的前导键", en: "Leader key for keybind combinations" },
  "keybind.app_exit": { "zh-CN": "退出应用", en: "Exit the application" },
  "keybind.editor_open": { "zh-CN": "打开外部编辑器", en: "Open external editor" },
  "keybind.theme_list": { "zh-CN": "列出可用主题", en: "List available themes" },
  "keybind.sidebar_toggle": { "zh-CN": "切换侧边栏", en: "Toggle sidebar" },
  "keybind.scrollbar_toggle": { "zh-CN": "切换会话滚动条", en: "Toggle session scrollbar" },
  "keybind.username_toggle": { "zh-CN": "切换用户名显示", en: "Toggle username visibility" },
  "keybind.status_view": { "zh-CN": "查看状态", en: "View status" },
  "keybind.session_export": { "zh-CN": "将会话导出到编辑器", en: "Export session to editor" },
  "keybind.session_new": { "zh-CN": "创建新会话", en: "Create a new session" },
  "keybind.session_list": { "zh-CN": "列出所有会话", en: "List all sessions" },
  "keybind.session_timeline": { "zh-CN": "显示会话时间线", en: "Show session timeline" },
  "keybind.session_share": { "zh-CN": "共享当前会话", en: "Share current session" },
  "keybind.session_unshare": { "zh-CN": "取消共享当前会话", en: "Unshare current session" },
  "keybind.session_interrupt": { "zh-CN": "中断当前会话", en: "Interrupt current session" },
  "keybind.session_compact": { "zh-CN": "压缩会话", en: "Compact the session" },
  "keybind.messages_page_up": { "zh-CN": "向上滚动一页消息", en: "Scroll messages up by one page" },
  "keybind.messages_page_down": { "zh-CN": "向下滚动一页消息", en: "Scroll messages down by one page" },
  "keybind.messages_line_up": { "zh-CN": "向上滚动一行消息", en: "Scroll messages up by one line" },
  "keybind.messages_line_down": { "zh-CN": "向下滚动一行消息", en: "Scroll messages down by one line" },
  "keybind.messages_half_page_up": { "zh-CN": "向上滚动半页消息", en: "Scroll messages up by half page" },
  "keybind.messages_half_page_down": { "zh-CN": "向下滚动半页消息", en: "Scroll messages down by half page" },
  "keybind.message_first": { "zh-CN": "跳转到第一条消息", en: "Navigate to first message" },
  "keybind.message_last": { "zh-CN": "跳转到最后一条消息", en: "Navigate to last message" },
  "keybind.message_next": { "zh-CN": "跳转到下一条消息", en: "Navigate to next message" },
  "keybind.message_previous": { "zh-CN": "跳转到上一条消息", en: "Navigate to previous message" },
  "keybind.message_last_user": { "zh-CN": "跳转到最后一条用户消息", en: "Navigate to last user message" },
  "keybind.message_copy": { "zh-CN": "复制消息", en: "Copy message" },
  "keybind.message_undo": { "zh-CN": "撤销消息", en: "Undo message" },
  "keybind.message_redo": { "zh-CN": "重做消息", en: "Redo message" },
  "keybind.code_conceal_toggle": {
    "zh-CN": "切换消息中的代码块隐藏状态",
    en: "Toggle code block concealment in messages",
  },
  "keybind.tool_details_toggle": { "zh-CN": "切换工具详情显示", en: "Toggle tool details visibility" },
  "keybind.model_list": { "zh-CN": "列出可用模型", en: "List available models" },
  "keybind.model_recent_next": { "zh-CN": "切换到下一个最近使用的模型", en: "Next recently used model" },
  "keybind.model_recent_previous": { "zh-CN": "切换到上一个最近使用的模型", en: "Previous recently used model" },
  "keybind.command_list": { "zh-CN": "列出可用命令", en: "List available commands" },
  "keybind.agent_list": { "zh-CN": "列出代理", en: "List agents" },
  "keybind.agent_next": { "zh-CN": "切换到下一个代理", en: "Next agent" },
  "keybind.agent_previous": { "zh-CN": "切换到上一个代理", en: "Previous agent" },
  "keybind.input_clear": { "zh-CN": "清除输入框", en: "Clear input field" },
  "keybind.delete_forward": { "zh-CN": "向前删除", en: "Forward delete" },
  "keybind.clipboard_paste": { "zh-CN": "从剪贴板粘贴", en: "Paste from clipboard" },
  "keybind.input_submit": { "zh-CN": "提交输入", en: "Submit input" },
  "keybind.input_newline": { "zh-CN": "在输入中插入换行", en: "Insert newline in input" },
  "keybind.history_previous": { "zh-CN": "上一条历史记录", en: "Previous history item" },
  "keybind.history_next": { "zh-CN": "下一条历史记录", en: "Next history item" },
  "keybind.child_session_next": { "zh-CN": "下一个子会话", en: "Next child session" },
  "keybind.child_session_previous": { "zh-CN": "上一个子会话", en: "Previous child session" },
  "keybind.terminal_suspend": { "zh-CN": "挂起终端", en: "Suspend terminal" },
  "keybind.terminal_title_toggle": { "zh-CN": "切换终端标题", en: "Toggle terminal title" },
  "agent.description": { "zh-CN": "代理适用场景的描述", en: "Description of when to use the agent" },
  "agent.color": {
    "zh-CN": "代理的十六进制颜色代码（例如 #FF5733）",
    en: "Hex color code for the agent (e.g., #FF5733)",
  },
  "agent.max_steps": {
    "zh-CN": "强制仅文本响应前允许的最大代理迭代次数",
    en: "Maximum number of agentic iterations before forcing text-only response",
  },
  "provider.copilot_enterprise_url": {
    "zh-CN": "用于 Copilot 身份验证的 GitHub Enterprise URL",
    en: "GitHub Enterprise URL for copilot authentication",
  },
  "provider.prompt_cache_key": {
    "zh-CN": "为此提供商启用 promptCacheKey（默认为 false）",
    en: "Enable promptCacheKey for this provider (default false)",
  },
  "provider.timeout": {
    "zh-CN": "向此提供商发出请求的超时时间（毫秒）。默认为 300000（5 分钟）；设为 false 可禁用超时。",
    en: "Timeout in milliseconds for requests to this provider. Default is 300000 (5 minutes). Set to false to disable timeout.",
  },
  "mcp.connection_type": { "zh-CN": "MCP 服务器连接类型", en: "Type of MCP server connection" },
  "mcp.command": { "zh-CN": "运行 MCP 服务器的命令和参数", en: "Command and arguments to run the MCP server" },
  "mcp.environment": {
    "zh-CN": "运行 MCP 服务器时设置的环境变量",
    en: "Environment variables to set when running the MCP server",
  },
  "mcp.enabled": { "zh-CN": "启动时启用或禁用 MCP 服务器", en: "Enable or disable the MCP server on startup" },
  "mcp.tools_timeout": {
    "zh-CN": "从 MCP 服务器获取工具的超时时间（毫秒）。未指定时默认为 5000（5 秒）。",
    en: "Timeout in ms for fetching tools from the MCP server. Defaults to 5000 (5 seconds) if not specified.",
  },
  "mcp.oauth_client_id": {
    "zh-CN": "OAuth 客户端 ID。未提供时会尝试动态客户端注册（RFC 7591）。",
    en: "OAuth client ID. If not provided, dynamic client registration (RFC 7591) will be attempted.",
  },
  "mcp.oauth_client_secret": {
    "zh-CN": "OAuth 客户端密钥（授权服务器需要时）",
    en: "OAuth client secret (if required by the authorization server)",
  },
  "mcp.oauth_scopes": { "zh-CN": "授权期间请求的 OAuth scope", en: "OAuth scopes to request during authorization" },
  "mcp.remote_url": { "zh-CN": "远程 MCP 服务器 URL", en: "URL of the remote MCP server" },
  "mcp.headers": { "zh-CN": "随请求发送的标头", en: "Headers to send with the request" },
  "mcp.oauth_config": {
    "zh-CN": "MCP 服务器的 OAuth 身份验证配置。设为 false 可禁用 OAuth 自动检测。",
    en: "OAuth authentication configuration for the MCP server. Set to false to disable OAuth auto-detection.",
  },
  "layout.stretch_deprecated": {
    "zh-CN": "@deprecated 始终使用 stretch 布局。",
    en: "@deprecated Always uses stretch layout.",
  },
  "config.schema_ref": {
    "zh-CN": "用于配置验证的 JSON Schema 引用",
    en: "JSON schema reference for configuration validation",
  },
  "config.theme": { "zh-CN": "界面使用的主题名称", en: "Theme name to use for the interface" },
  "config.log_level": { "zh-CN": "日志级别", en: "Log level" },
  "config.tui": { "zh-CN": "TUI 专用设置", en: "TUI specific settings" },
  "config.tui_scroll_speed": { "zh-CN": "TUI 滚动速度", en: "TUI scroll speed" },
  "config.scroll_acceleration": { "zh-CN": "滚动加速设置", en: "Scroll acceleration settings" },
  "config.scroll_acceleration_enabled": { "zh-CN": "启用滚动加速", en: "Enable scroll acceleration" },
  "config.diff_style": {
    "zh-CN": "控制差异渲染样式：auto 会适应终端宽度，stacked 始终使用单列。",
    en: "Control diff rendering style: 'auto' adapts to terminal width, 'stacked' always shows single column",
  },
  "config.commands": {
    "zh-CN": "命令配置，参见 https://github.com/miaopan607/miaopan-code/docs/commands",
    en: "Command configuration, see https://github.com/miaopan607/miaopan-code/docs/commands",
  },
  "config.share": {
    "zh-CN": "控制共享行为：manual 允许通过命令手动共享，auto 启用自动共享，disabled 禁用所有共享。",
    en: "Control sharing behavior:'manual' allows manual sharing via commands, 'auto' enables automatic sharing, 'disabled' disables all sharing",
  },
  "config.autoshare_deprecated": {
    "zh-CN": "@deprecated 请改用 share 字段。自动共享新创建的会话。",
    en: "@deprecated Use 'share' field instead. Share newly created sessions automatically",
  },
  "config.autoupdate": {
    "zh-CN": "自动更新到最新版本。设为 true 可自动更新，false 可禁用，notify 则显示更新通知。",
    en: "Automatically update to the latest version. Set to true to auto-update, false to disable, or 'notify' to show update notifications",
  },
  "config.disabled_providers": {
    "zh-CN": "禁用自动加载的提供商",
    en: "Disable providers that are loaded automatically",
  },
  "config.enabled_providers": {
    "zh-CN": "设置后仅启用这些提供商，忽略所有其他提供商。",
    en: "When set, ONLY these providers will be enabled. All other providers will be ignored",
  },
  "config.model": {
    "zh-CN": "使用的模型，格式为 provider/model，例如 anthropic/claude-2",
    en: "Model to use in the format of provider/model, eg anthropic/claude-2",
  },
  "config.small_model": {
    "zh-CN": "用于标题生成等任务的小模型，格式为 provider/model",
    en: "Small model to use for tasks like title generation in the format of provider/model",
  },
  "config.username": {
    "zh-CN": "在对话中代替系统用户名显示的自定义用户名",
    en: "Custom username to display in conversations instead of system username",
  },
  "config.mode_deprecated": {
    "zh-CN": "@deprecated 请改用 agent 字段。",
    en: "@deprecated Use `agent` field instead.",
  },
  "config.agents": {
    "zh-CN": "代理配置，参见 https://github.com/miaopan607/miaopan-code/docs/agent",
    en: "Agent configuration, see https://github.com/miaopan607/miaopan-code/docs/agent",
  },
  "config.providers": {
    "zh-CN": "自定义提供商配置和模型覆盖",
    en: "Custom provider configurations and model overrides",
  },
  "config.mcp": {
    "zh-CN": "MCP（模型上下文协议）服务器配置",
    en: "MCP (Model Context Protocol) server configurations",
  },
  "config.instructions": {
    "zh-CN": "要包含的额外指令文件或模式",
    en: "Additional instruction files or patterns to include",
  },
  "config.enterprise_url": { "zh-CN": "企业版 URL", en: "Enterprise URL" },
  "config.chat_retries": {
    "zh-CN": "聊天补全失败时的重试次数",
    en: "Number of retries for chat completions on failure",
  },
  "config.batch_tool": { "zh-CN": "启用批处理工具", en: "Enable the batch tool" },
  "config.telemetry": {
    "zh-CN": "为 AI SDK 调用启用 OpenTelemetry span（使用 experimental_telemetry 标志）",
    en: "Enable OpenTelemetry spans for AI SDK calls (using the 'experimental_telemetry' flag)",
  },
  "config.primary_tools": {
    "zh-CN": "仅主代理可用的工具。",
    en: "Tools that should only be available to primary agents.",
  },
  "response.event_stream": { "zh-CN": "事件流", en: "Event stream" },
  "response.current_project": { "zh-CN": "当前项目", en: "Current project" },
  "response.bad_request": { "zh-CN": "错误请求", en: "Bad request" },
  "response.created_session": { "zh-CN": "已创建的会话", en: "Created session" },
  "response.not_found": { "zh-CN": "未找到", en: "Not found" },
  "response.session_removed": { "zh-CN": "会话已移除", en: "Session removed" },
  "response.session_info": { "zh-CN": "会话信息", en: "Session info" },
  "response.session_updated": { "zh-CN": "会话已更新", en: "Updated session" },
  "response.session_connected": { "zh-CN": "已连接的会话", en: "Connected session" },
  "response.config_info": { "zh-CN": "配置信息", en: "Get config info" },
  "response.config_updated": { "zh-CN": "配置已成功更新", en: "Successfully updated config" },
  "response.tool_ids": { "zh-CN": "工具 ID", en: "Tool IDs" },
  "response.instance_disposed": { "zh-CN": "实例已释放", en: "Instance disposed" },
  "response.vcs_info": { "zh-CN": "版本控制信息", en: "VCS info" },
  "response.session_created": { "zh-CN": "会话已成功创建", en: "Successfully created session" },
  "response.session_status": { "zh-CN": "会话状态", en: "Get session status" },
  "response.session_deleted": { "zh-CN": "会话已成功删除", en: "Successfully deleted session" },
  "response.session_get": { "zh-CN": "获取会话", en: "Get session" },
  "response.session_update": { "zh-CN": "会话已成功更新", en: "Successfully updated session" },
  "response.todo_list": { "zh-CN": "待办列表", en: "Todo list" },
  "response.session_aborted": { "zh-CN": "会话已中止", en: "Aborted session" },
  "response.session_unshared": { "zh-CN": "会话已成功取消共享", en: "Successfully unshared session" },
  "response.session_shared": { "zh-CN": "会话已成功共享", en: "Successfully shared session" },
  "response.session_summarized": { "zh-CN": "会话已总结", en: "Summarized session" },
  "response.message_created": { "zh-CN": "消息已创建", en: "Created message" },
  "response.prompt_accepted": { "zh-CN": "提示已接受", en: "Prompt accepted" },
  "response.permission_processed": { "zh-CN": "权限已成功处理", en: "Permission processed successfully" },
  "response.provider_auth_methods": { "zh-CN": "提供商身份验证方式", en: "Provider auth methods" },
  "response.auth_method_index": { "zh-CN": "身份验证方式索引", en: "Auth method index" },
  "response.authorization_url_method": { "zh-CN": "授权 URL 和方式", en: "Authorization URL and method" },
  "response.oauth_code": { "zh-CN": "OAuth 授权码", en: "OAuth authorization code" },
  "response.oauth_callback": { "zh-CN": "OAuth 回调已成功处理", en: "OAuth callback processed successfully" },
  "response.file_paths": { "zh-CN": "文件路径", en: "File paths" },
  "response.files_directories": { "zh-CN": "文件和目录", en: "Files and directories" },
  "response.file_content": { "zh-CN": "文件内容", en: "File content" },
  "response.file_status": { "zh-CN": "文件状态", en: "File status" },
  "response.log_service": { "zh-CN": "日志条目的服务名称", en: "Service name for the log entry" },
  "response.log_message": { "zh-CN": "日志消息", en: "Log message" },
  "response.log_metadata": { "zh-CN": "日志条目的额外元数据", en: "Additional metadata for the log entry" },
  "response.log_written": { "zh-CN": "日志条目已成功写入", en: "Log entry written successfully" },
  "response.mcp_status": { "zh-CN": "MCP 服务器状态", en: "MCP server status" },
  "response.mcp_added": { "zh-CN": "MCP 服务器已成功添加", en: "MCP server added successfully" },
  "response.oauth_removed": { "zh-CN": "OAuth 凭据已移除", en: "OAuth credentials removed" },
  "response.oauth_started": { "zh-CN": "OAuth 流程已开始", en: "OAuth flow started" },
  "response.oauth_url": { "zh-CN": "要在浏览器中打开以进行授权的 URL", en: "URL to open in browser for authorization" },
  "response.oauth_callback_code": { "zh-CN": "OAuth 回调中的授权码", en: "Authorization code from OAuth callback" },
  "response.oauth_completed": { "zh-CN": "OAuth 身份验证已完成", en: "OAuth authentication completed" },
  "response.mcp_connected": { "zh-CN": "MCP 服务器已成功连接", en: "MCP server connected successfully" },
  "response.mcp_disconnected": { "zh-CN": "MCP 服务器已成功断开连接", en: "MCP server disconnected successfully" },
  "response.lsp_status": { "zh-CN": "LSP 服务器状态", en: "LSP server status" },
  "response.formatter_status": { "zh-CN": "格式化程序状态", en: "Formatter status" },
  "response.prompt_processed": { "zh-CN": "提示已成功处理", en: "Prompt processed successfully" },
  "response.help_opened": { "zh-CN": "帮助对话框已成功打开", en: "Help dialog opened successfully" },
  "response.session_dialog_opened": { "zh-CN": "会话对话框已成功打开", en: "Session dialog opened successfully" },
  "response.theme_dialog_opened": { "zh-CN": "主题对话框已成功打开", en: "Theme dialog opened successfully" },
  "response.model_dialog_opened": { "zh-CN": "模型对话框已成功打开", en: "Model dialog opened successfully" },
  "response.prompt_submitted": { "zh-CN": "提示已成功提交", en: "Prompt submitted successfully" },
  "response.prompt_cleared": { "zh-CN": "提示已成功清除", en: "Prompt cleared successfully" },
  "response.command_executed": { "zh-CN": "命令已成功执行", en: "Command executed successfully" },
  "response.toast_shown": { "zh-CN": "通知已成功显示", en: "Toast notification shown successfully" },
  "response.event_published": { "zh-CN": "事件已成功发布", en: "Event published successfully" },
  "response.next_tui_request": { "zh-CN": "下一个 TUI 请求", en: "Next TUI request" },
  "response.submitted": { "zh-CN": "响应已成功提交", en: "Response submitted successfully" },
  "response.credentials_set": { "zh-CN": "身份验证凭据已成功设置", en: "Successfully set authentication credentials" },
} as const

const generatedTemplateDocs = {
  generated_file_header: {
    "zh-CN": "此文件由 @hey-api/openapi-ts 自动生成",
    en: "This file is auto-generated by @hey-api/openapi-ts",
  },
  create_client_config: {
    "zh-CN":
      "`createClientConfig()` 函数会在客户端初始化时调用，返回的对象将成为客户端的初始配置。\n\n你可能希望通过这种方式初始化客户端，而不是调用 `setConfig()`。例如在使用 Next.js 时，这有助于确保客户端始终具有正确的值。",
    en: "The `createClientConfig()` function will be called on client initialization\nand the returned object will become the client's initial configuration.\n\nYou may want to initialize your client this way instead of calling\n`setConfig()`. This is useful for example if you're using Next.js\nto ensure your client always has the correct values.",
  },
  client_base_url: {
    "zh-CN": "此客户端发出的所有请求的基础 URL。",
    en: "Base URL for all requests made by this client.",
  },
  fetch_implementation: {
    "zh-CN": "Fetch API 实现。可使用此选项提供自定义 fetch 实例。\n\n@default globalThis.fetch",
    en: "Fetch API implementation. You can use this option to provide a custom\nfetch instance.\n\n@default globalThis.fetch",
  },
  nextjs_fetch_warning: {
    "zh-CN":
      "请勿在 Next.js 应用中使用 Fetch 客户端；`next` 选项不会生效。\n\n请改为安装 {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`}。",
    en: "Please don't use the Fetch client for Next.js applications. The `next`\noptions won't have any effect.\n\nInstall {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`} instead.",
  },
  response_parse_format: {
    "zh-CN":
      "按指定格式解析并返回响应数据。默认情况下，`auto` 会根据响应的 `Content-Type` 标头推断适当的方法。可使用任意 {@link Body} 方法覆盖此行为。如果完全不想解析响应数据，请选择 `stream`。\n\n@default 'auto'",
    en: "Return the response data parsed in a specified format. By default, `auto`\nwill infer the appropriate method from the `Content-Type` response header.\nYou can override this behavior with any of the {@link Body} methods.\nSelect `stream` if you don't want to parse response data at all.\n\n@default 'auto'",
  },
  response_return_shape: {
    "zh-CN": "只返回数据，还是返回多个字段（data、error、response 等）？\n\n@default 'fields'",
    en: "Should we return only data or multiple fields (data, error, response, etc.)?\n\n@default 'fields'",
  },
  response_throw_error: {
    "zh-CN": "是否抛出错误，而不是在响应中返回错误？\n\n@default false",
    en: "Throw an error instead of returning it in the response?\n\n@default false",
  },
  request_body: {
    "zh-CN": "要添加到请求中的任意正文。\n\n{@link https://developer.mozilla.org/docs/Web/API/fetch#body}",
    en: "Any body that you want to add to your request.\n\n{@link https://developer.mozilla.org/docs/Web/API/fetch#body}",
  },
  request_security: {
    "zh-CN": "请求使用的安全机制。",
    en: "Security mechanism(s) to use for the request.",
  },
  parse_as_inference: {
    "zh-CN": "根据提供的 Content-Type 标头推断 parseAs 值。",
    en: "Infers parseAs value from provided Content-Type header.",
  },
  missing_content_type: {
    "zh-CN": "如果未提供 Content-Type 标头，最佳做法是返回原始响应正文，",
    en: "If no Content-Type header is provided, the best we can do is return the raw response body,",
  },
  stream_equivalence: {
    "zh-CN": "这实际上与 `stream` 选项相同。",
    en: "which is effectively the same as the 'stream' option.",
  },
  object_headers_json: {
    "zh-CN": "假定对象标头应进行 JSON 字符串化，即其",
    en: "assume object headers are meant to be JSON stringified, i.e. their",
  },
  openapi_json_content: {
    "zh-CN": "在 OpenAPI 规范中的 content 值为 'application/json'",
    en: "content value in OpenAPI specification is 'application/json'",
  },
  auth_location: {
    "zh-CN": "使用请求的哪个部分发送身份验证信息？\n\n@default 'header'",
    en: "Which part of the request do we use to send the auth?\n\n@default 'header'",
  },
  auth_parameter_name: {
    "zh-CN": "标头或查询参数名称。\n\n@default 'Authorization'",
    en: "Header or query parameter name.\n\n@default 'Authorization'",
  },
  body_serialization_overrides: {
    "zh-CN": "按参数覆盖序列化设置。提供后，这些设置会覆盖特定参数名称的全局数组/对象设置。",
    en: "Per-parameter serialization overrides. When provided, these settings\noverride the global array/object settings for specific parameter names.",
  },
  parameter_field_name: {
    "zh-CN": "字段名称。这是希望用户看到和使用的名称。",
    en: "Field name. This is the name we want the user to see and use.",
  },
  parameter_mapped_name: {
    "zh-CN": "字段映射名称。这是请求中要使用的名称。未提供时，使用与 `key` 相同的值。",
    en: "Field mapped name. This is the name we want to use in the request.\nIf omitted, we use the same value as `key`.",
  },
  parameter_mapped_transport: {
    "zh-CN": "字段映射名称。这是请求中要使用的名称。如果省略 `in`，`map` 会在传输层将 `key` 设为别名。",
    en: "Field mapped name. This is the name we want to use in the request.\nIf `in` is omitted, `map` aliases `key` to the transport layer.",
  },
  body_key_optional: {
    "zh-CN": "正文不要求提供 key。",
    en: "Key isn't required for bodies.",
  },
  query_json_union: {
    "zh-CN": "与 Pinia Colada 可哈希内容对应的 JSON 友好联合类型。",
    en: "JSON-friendly union that mirrors what Pinia Colada can hash.",
  },
  query_value_replacer: {
    "zh-CN": "将非 JSON 值（bigint、Date 等）转换为安全替代值的 replacer。",
    en: "Replacer that converts non-JSON values (bigint, Date, etc.) to safe substitutes.",
  },
  query_safe_stringify: {
    "zh-CN": "安全地将值字符串化，再解析回 JsonValue。",
    en: "Safely stringifies a value and parses it back into a JsonValue.",
  },
  query_plain_object: {
    "zh-CN": "检测普通对象（包括原型为 null 的对象）。",
    en: "Detects plain objects (including objects with a null prototype).",
  },
  query_url_search_params: {
    "zh-CN": "将 URLSearchParams 转换为排序后的 JSON 对象，以生成确定性 key。",
    en: "Turns URLSearchParams into a sorted JSON object for deterministic keys.",
  },
  query_normalize: {
    "zh-CN": "将任意可接受值规范化为查询 key 使用的 JSON 友好结构。",
    en: "Normalizes any accepted value into a JSON-friendly shape for query keys.",
  },
  sse_request_interceptors: {
    "zh-CN": "实现客户端可在此钩子中调用请求拦截器。",
    en: "Implementing clients can call request interceptors inside this hook.",
  },
  sse_error_callback: {
    "zh-CN":
      "流式传输期间发生网络或解析错误时调用的回调。\n\n此选项仅适用于返回事件流的端点。\n\n@param error 发生的错误。",
    en: "Callback invoked when a network or parsing error occurs during streaming.\n\nThis option applies only if the endpoint returns a stream of events.\n\n@param error The error that occurred.",
  },
  sse_event_callback: {
    "zh-CN":
      "服务器流式传输事件时调用的回调。\n\n此选项仅适用于返回事件流的端点。\n\n@param event 服务器流式传输的事件。\n@returns 无返回值（void）。",
    en: "Callback invoked when an event is streamed from the server.\n\nThis option applies only if the endpoint returns a stream of events.\n\n@param event Event streamed from the server.\n@returns Nothing (void).",
  },
  sse_default_retry: {
    "zh-CN": "默认重试延迟（毫秒）。\n\n此选项仅适用于返回事件流的端点。\n\n@default 3000",
    en: "Default retry delay in milliseconds.\n\nThis option applies only if the endpoint returns a stream of events.\n\n@default 3000",
  },
  sse_max_attempts: {
    "zh-CN": "放弃前的最大重试次数。",
    en: "Maximum number of retry attempts before giving up.",
  },
  sse_max_delay: {
    "zh-CN": "最大重试延迟（毫秒）。\n\n仅在使用指数退避时适用。\n\n此选项仅适用于返回事件流的端点。\n\n@default 30000",
    en: "Maximum retry delay in milliseconds.\n\nApplies only when exponential backoff is used.\n\nThis option applies only if the endpoint returns a stream of events.\n\n@default 30000",
  },
  sse_sleep: {
    "zh-CN": "用于重试退避的可选 sleep 函数。\n\n默认使用 `setTimeout`。",
    en: "Optional sleep function for retry backoff.\n\nDefaults to using `setTimeout`.",
  },
  sse_retry: {
    "zh-CN": "连接失败或中止；延迟后重试",
    en: "connection failed or aborted; retry after delay",
  },
  sse_backoff: {
    "zh-CN": "指数退避：每次尝试将重试延迟加倍，上限为 30 秒",
    en: "exponential backoff: double retry each attempt, cap at 30s",
  },
  sse_normalize_lines: {
    "zh-CN": "规范化换行符：CRLF -> LF，然后 CR -> LF",
    en: "Normalize line endings: CRLF -> LF, then CR -> LF",
  },
  sse_exit_normal: {
    "zh-CN": "正常完成时退出循环",
    en: "exit loop on normal completion",
  },
  sse_stop_after_error: {
    "zh-CN": "触发错误后停止",
    en: "stop after firing error",
  },
  client_remove_content_type: {
    "zh-CN": "正文为空时移除 Content-Type 标头，以免发送无效请求",
    en: "remove Content-Type header if body is empty to avoid sending invalid requests",
  },
  client_fetch_binding: {
    "zh-CN": "必须在此处分配 fetch，否则会抛出以下错误：",
    en: "fetch must be assigned here, otherwise it would throw the error:",
  },
  client_fetch_exceptions: {
    "zh-CN": "处理 fetch 异常（AbortError、网络错误等）",
    en: "Handle fetch exceptions (AbortError, network errors, etc.)",
  },
  client_error_response: {
    "zh-CN": "返回错误响应",
    en: "Return error response",
  },
  client_empty_success: {
    "zh-CN": "某些服务器返回 200，但没有 Content-Length 且正文为空。",
    en: "Some servers return 200 with no Content-Length and empty body.",
  },
  client_parse_nonempty: {
    "zh-CN": "response.json() 会抛出异常；先读取文本，仅在非空时解析。",
    en: "response.json() would throw; read as text and parse if non-empty.",
  },
  client_error_types_todo: {
    "zh-CN": "TODO：可能应返回错误并改进类型",
    en: "TODO: we probably want to return error and improve types",
  },
  interceptors_external: {
    "zh-CN": "`createInterceptors()` 的响应供外部使用，因为它不会",
    en: "`createInterceptors()` response, meant for external use as it does not",
  },
  interceptors_hide_internals: {
    "zh-CN": "暴露内部实现",
    en: "expose internals",
  },
  middleware_return_type: {
    "zh-CN": "不要将 `Middleware` 添加为返回类型，以便内部使用 _fns",
    en: "do not add `Middleware` as return type so we can use _fns internally",
  },
  request_body_serializer: {
    "zh-CN": "用于序列化请求正文参数的函数。默认使用 {@link JSON.stringify()}。",
    en: "A function for serializing request body parameter. By default,\n{@link JSON.stringify()} will be used.",
  },
  request_query_serializer: {
    "zh-CN":
      "用于序列化请求查询参数的函数。默认情况下，数组使用 form 样式展开，对象使用 deepObject 样式展开，并对保留字符进行百分号编码。\n\n如果使用原生 `paramsSerializer()` Axios API 函数，此方法不会生效。\n\n{@link https://swagger.io/docs/specification/serialization/#query 查看示例}",
    en: "A function for serializing request query parameters. By default, arrays\nwill be exploded in form style, objects will be exploded in deepObject\nstyle, and reserved characters are percent-encoded.\n\nThis method will have no effect if the native `paramsSerializer()` Axios\nAPI function is used.\n\n{@link https://swagger.io/docs/specification/serialization/#query View examples}",
  },
  response_transformer: {
    "zh-CN": "在返回响应数据前进行转换的函数。可用于后处理数据，例如将 ISO 字符串转换为 Date 对象。",
    en: "A function transforming response data before it's returned. This is useful\nfor post-processing data, e.g. converting ISO strings into Date objects.",
  },
  request_validator: {
    "zh-CN": "验证请求数据的函数。用于确保请求符合预期结构，从而可安全发送到服务器。",
    en: "A function validating request data. This is useful if you want to ensure\nthe request conforms to the desired shape, so it can be safely sent to\nthe server.",
  },
  response_validator: {
    "zh-CN": "验证响应数据的函数。用于确保响应符合预期结构，从而可安全传递给转换器并返回给用户。",
    en: "A function validating response data. This is useful if you want to ensure\nthe response conforms to the desired shape, so it can be safely passed to\nthe transformers and returned to the user.",
  },
  request_headers: {
    "zh-CN":
      "包含要预填充到 `Headers` 对象中的任意 HTTP 标头的对象。\n\n{@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init 查看更多}",
    en: "An object containing any HTTP headers that you want to pre-populate your\n`Headers` object with.\n\n{@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init See more}",
  },
  request_method: {
    "zh-CN": "请求方法。\n\n{@link https://developer.mozilla.org/docs/Web/API/fetch#method 查看更多}",
    en: "The request method.\n\n{@link https://developer.mozilla.org/docs/Web/API/fetch#method See more}",
  },
  request_auth_token: {
    "zh-CN": "身份验证令牌或返回身份验证令牌的函数。解析后的值会按其 `security` 数组定义添加到请求负载。",
    en: "Auth token or a function returning auth token. The resolved value will be\nadded to the request payload as defined by its `security` array.",
  },
  final_request_url: {
    "zh-CN": "返回最终请求 URL。",
    en: "Returns the final request URL.",
  },
  utils_serialized_body: {
    "zh-CN": "并非所有客户端都实现 serializedBody 属性（例如 client-axios）",
    en: "not all clients implement a serializedBody property (i.e. client-axios)",
  },
  utils_plain_text_body: {
    "zh-CN": "纯文本正文",
    en: "plain/text body",
  },
  utils_no_body: {
    "zh-CN": "未提供正文",
    en: "no body was provided",
  },
} as const

export type Language = "zh-CN" | "en"
export type MessageKey = keyof typeof messages
export type MessageParameters = Record<string, string | number | undefined>

export function resolveLanguage(input: unknown): Language {
  return input === "en" ? "en" : "zh-CN"
}

export function t(language: Language | undefined, key: MessageKey, parameters: MessageParameters = {}) {
  return messages[key][resolveLanguage(language)].replace(/{{(\w+)}}/g, (_, name: string) =>
    String(parameters[name] ?? ""),
  )
}

export function legacyDoc(language: Language | undefined, key: string) {
  if (!(key in legacyDocs)) return undefined
  return legacyDocs[key as keyof typeof legacyDocs][resolveLanguage(language)]
}

export function legacyTypeDoc(language: Language | undefined, text: string) {
  const entry = Object.values(legacyTypeDocs).find((value) => value.en === text || value["zh-CN"] === text)
  return entry?.[resolveLanguage(language)]
}

export function generatedTemplateDoc(language: Language | undefined, text: string) {
  const entry = Object.values(generatedTemplateDocs).find((value) => value.en === text || value["zh-CN"] === text)
  return entry?.[resolveLanguage(language)]
}
