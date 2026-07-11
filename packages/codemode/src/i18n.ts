export const Language = ["zh-CN", "en"] as const
export type Language = (typeof Language)[number]

export const messages = {
  "codemode.error.tool_execution_failed": { "zh-CN": "工具执行失败", en: "Tool execution failed" },
  "codemode.error.maximum_value_depth": {
    "zh-CN": "{{label}} 超过了最大值深度 {{maximum}}。",
    en: "{{label}} exceeds the maximum value depth of {{maximum}}.",
  },
  "codemode.error.data_only": { "zh-CN": "{{label}} 只能包含数据。", en: "{{label}} must contain data only." },
  "codemode.error.unawaited_promise": {
    "zh-CN":
      "{{label}} 包含未等待的 Promise；请先等待工具调用（例如 `const result = await tools.ns.tool(...)`），再使用其结果。",
    en: "{{label}} contains an un-awaited Promise; await tool calls (e.g. `const result = await tools.ns.tool(...)`) before using their results.",
  },
  "codemode.error.circular_value": { "zh-CN": "{{label}} 包含循环值。", en: "{{label}} contains a circular value." },
  "codemode.error.plain_objects_only": {
    "zh-CN": "{{label}} 只能包含普通对象。",
    en: "{{label}} must contain plain objects only.",
  },
  "codemode.error.blocked_property": {
    "zh-CN": "{{label}} 包含被禁止的属性“{{property}}”。",
    en: "{{label}} contains blocked property '{{property}}'.",
  },
  "codemode.search.description": { "zh-CN": "搜索可用的 Code Mode 工具", en: "Search available Code Mode tools" },
  "codemode.error.reserved_namespace": {
    "zh-CN": "工具命名空间“{{namespace}}”已保留给 CodeMode 发现工具。",
    en: "Tool namespace '{{namespace}}' is reserved for CodeMode discovery tools.",
  },
  "codemode.error.invalid_catalog_budget": {
    "zh-CN": "discovery.catalogBudget 必须是非负安全整数",
    en: "discovery.catalogBudget must be a non-negative safe integer",
  },
  "codemode.instructions.intro_empty": {
    "zh-CN": "这是一个用于调用工具的受限 JavaScript 语言，并非通用运行时。",
    en: "This is a restricted JavaScript language for calling tools, not a general-purpose runtime.",
  },
  "codemode.instructions.intro_complete": {
    "zh-CN":
      "这是一个用于调用工具的受限 JavaScript 语言，并非通用运行时。在受限解释器中，`tools` 包含下方列出的 Code Mode 工具和内部运行时工具；外层代理工具不可用。",
    en: "This is a restricted JavaScript language for calling tools, not a general-purpose runtime. Inside the confined interpreter, `tools` contains the Code Mode tools listed below and internal runtime tools; surrounding agent tools are not available.",
  },
  "codemode.instructions.intro_partial": {
    "zh-CN":
      "这是一个用于调用工具的受限 JavaScript 语言，并非通用运行时。在受限解释器中，`tools` 包含下方列出或可搜索的 Code Mode 工具和内部运行时工具；外层代理工具不可用。",
    en: "This is a restricted JavaScript language for calling tools, not a general-purpose runtime. Inside the confined interpreter, `tools` contains the Code Mode tools listed or searchable below and internal runtime tools; surrounding agent tools are not available.",
  },
  "codemode.instructions.exact_names": {
    "zh-CN": "不要推断或规范化工具名称；只能使用下方显示或搜索返回的精确签名。",
    en: "Do not infer or normalize tool names; use only exact signatures shown below or returned by search.",
  },
  "codemode.instructions.workflow_heading": { "zh-CN": "## 工作流程", en: "## Workflow" },
  "codemode.instructions.workflow_complete_pick": {
    "zh-CN": "1. 从 `## 可用工具` 下的列表中选择工具——每一行都是精确调用签名；请原样使用，不要猜测路径段。",
    en: "1. Pick a tool from the list under `## Available tools` - each line is the exact call signature; use it as-is rather than guessing segments.",
  },
  "codemode.instructions.workflow_complete_call": {
    "zh-CN":
      "2. 使用显示的精确签名调用：`const result = await tools.<namespace>.<tool>(input)`；方括号表示法和引号都是路径的一部分。",
    en: "2. Call it using the exact signature shown: `const result = await tools.<namespace>.<tool>(input)`; bracket notation and quotes are part of the path.",
  },
  "codemode.instructions.workflow_complete_return": {
    "zh-CN": "3. 只返回结构化结果中需要的字段；读取字段前先缩小未知结果的类型，并避免返回大量原始载荷。",
    en: "3. Return only the fields you need from structured results; narrow unknown results before reading fields, and avoid returning large raw payloads.",
  },
  "codemode.instructions.workflow_partial_search": {
    "zh-CN": '1. 如有需要，先发现工具：`return await tools.$codemode.search({ query: "<意图 + 关键名词>" })`。',
    en: '1. If needed, discover tools: `return await tools.$codemode.search({ query: "<intent + key nouns>" })`.',
  },
  "codemode.instructions.workflow_partial_call": {
    "zh-CN": "2. 在下一次执行中精确复制返回的路径，调用它，并且只返回所需字段。",
    en: "2. In the next execution, copy a returned path exactly, call it, and return only the needed fields.",
  },
  "codemode.instructions.rules_heading": { "zh-CN": "## 规则", en: "## Rules" },
  "codemode.instructions.rules_tools_complete": {
    "zh-CN": "- 只有此处列出的 Code Mode 工具和内部运行时工具可用；外层代理工具不会被隐式暴露。",
    en: "- Only Code Mode tools listed here and internal runtime tools are available; surrounding agent tools are not implicitly exposed.",
  },
  "codemode.instructions.rules_tools_partial": {
    "zh-CN":
      "- 只有此处列出或由 `tools.$codemode.search` 返回的 Code Mode 工具以及内部运行时工具可用；外层代理工具不会被隐式暴露。",
    en: "- Only Code Mode tools listed here or returned by `tools.$codemode.search` and internal runtime tools are available; surrounding agent tools are not implicitly exposed.",
  },
  "codemode.instructions.rules_transform": {
    "zh-CN": "- 在代码中筛选、聚合和转换集合——绝不要原样返回集合，也不要跨消息逐项调用工具。",
    en: "- Filter, aggregate, and transform collections in code - never return them raw or call a tool per item across messages.",
  },
  "codemode.instructions.rules_unknown_result": {
    "zh-CN":
      "- 类型为 `Promise<unknown>` 的结果可能是结构化数据或文本。读取字段前，先检查它是非空对象且不是数组；否则应直接处理返回的文本或原始值。",
    en: "- A result typed `Promise<unknown>` may be structured data or text. Before reading fields, check that it is a non-null object and not an array; otherwise handle the returned text or primitive directly.",
  },
  "codemode.instructions.rules_parallel": {
    "zh-CN":
      '- 并行运行互不依赖的调用：`await Promise.all(items.map((item) => tools.<namespace>.<tool>(item)))`；当列出的签名使用方括号表示法时，使用 `tools.<namespace>["tool-name"](item)`。',
    en: '- Run independent calls in parallel: `await Promise.all(items.map((item) => tools.<namespace>.<tool>(item)))`, or use `tools.<namespace>["tool-name"](item)` when the listed signature uses bracket notation.',
  },
  "codemode.instructions.rules_enumerate": {
    "zh-CN":
      "- `Object.keys(tools)` 列出命名空间；`Object.keys(tools.<namespace>)` 列出其中的工具；两者都支持 `for...in`。",
    en: "- `Object.keys(tools)` lists namespaces; `Object.keys(tools.<namespace>)` lists its tools; `for...in` works on both.",
  },
  "codemode.instructions.rules_browse_namespace": {
    "zh-CN": '- 浏览一个命名空间：`await tools.$codemode.search({ query: "", namespace: "<name>" })`。',
    en: '- Browse one namespace: `await tools.$codemode.search({ query: "", namespace: "<name>" })`.',
  },
  "codemode.instructions.rules_next_offset": {
    "zh-CN": "- 如果搜索返回 `next`，使用 `offset: next.offset` 重复相同搜索。",
    en: "- If search returns `next`, repeat the same search with `offset: next.offset`.",
  },
  "codemode.instructions.language_heading": { "zh-CN": "## 语言", en: "## Language" },
  "codemode.instructions.language_supported": {
    "zh-CN":
      "使用常见的 JavaScript 数据操作、函数、控制流、选定的标准库方法和已等待的工具调用。内置对象包括 Date、RegExp、Map、Set、URL、URLSearchParams 和 URI 编码辅助函数。",
    en: "Use common JavaScript data operations, functions, control flow, selected standard-library methods, and awaited tool calls. Built-ins include Date, RegExp, Map, Set, URL, URLSearchParams, and URI encoding helpers.",
  },
  "codemode.instructions.language_unavailable": {
    "zh-CN":
      "模块/import、类、生成器、计时器、fetch、eval、原型访问、未列出的方法和 Promise 链式调用不可用。外部操作请使用 Code Mode 工具。请使用 await 和 try/catch。",
    en: "Modules/imports, classes, generators, timers, fetch, eval, prototype access, unlisted methods, and promise chaining are unavailable. Use Code Mode tools for external operations. Use await with try/catch.",
  },
  "codemode.instructions.language_serialization": {
    "zh-CN": "Date 和 URL 在数据边界处序列化为字符串；Map/Set/RegExp/URLSearchParams 序列化为 `{}`。",
    en: "Dates and URLs serialize to strings at data boundaries; Map/Set/RegExp/URLSearchParams serialize to `{}`.",
  },
  "codemode.instructions.tools_heading": { "zh-CN": "## 可用工具", en: "## Available tools" },
  "codemode.instructions.no_tools": { "zh-CN": "当前没有可用工具。", en: "No tools are currently available." },
  "codemode.instructions.tools_complete": {
    "zh-CN": "## 可用工具（完整列表——下方显示了每个工具的完整调用签名）",
    en: "## Available tools (COMPLETE list - every tool is shown below with its full call signature)",
  },
  "codemode.instructions.tools_partial": {
    "zh-CN": "## 可用工具（部分列表——已显示 {{shown}}/{{total}}；其余请使用 tools.$codemode.search 查找）",
    en: "## Available tools (PARTIAL - {{shown}} of {{total}} shown; find the rest with tools.$codemode.search)",
  },
  "codemode.instructions.tool_count_one": { "zh-CN": "1 个工具", en: "1 tool" },
  "codemode.instructions.tool_count_many": { "zh-CN": "{{count}} 个工具", en: "{{count}} tools" },
  "codemode.instructions.none_shown": { "zh-CN": "{{count}}，未显示", en: "{{count}}, none shown" },
  "codemode.instructions.some_shown": {
    "zh-CN": "{{count}}，已显示 {{shown}} 个",
    en: "{{count}}, {{shown}} shown",
  },
  "codemode.instructions.search_signatures": {
    "zh-CN": "搜索会返回完整的可调用签名：",
    en: "Search returns complete callable signatures:",
  },
  "codemode.error.unknown_namespace": {
    "zh-CN": "未知工具命名空间“{{path}}”。",
    en: "Unknown tool namespace '{{path}}'.",
  },
  "codemode.error.unknown_tool": { "zh-CN": "未知工具“{{path}}”。", en: "Unknown tool '{{path}}'." },
  "codemode.error.tool_not_callable": { "zh-CN": "工具“{{path}}”不可调用。", en: "Tool '{{path}}' is not callable." },
  "codemode.error.discovery_hint": {
    "zh-CN": "Object.keys(tools) 会列出可用命名空间；tools.$codemode.search({ query }) 可查找已有描述的工具。",
    en: "Object.keys(tools) lists the available namespaces; tools.$codemode.search({ query }) finds described tools.",
  },
  "codemode.error.search_hint": {
    "zh-CN": "使用 tools.$codemode.search({ query }) 查找已有描述的可用工具。",
    en: "Use tools.$codemode.search({ query }) to find available described tools.",
  },
  "codemode.label.tool_result": { "zh-CN": "工具“{{name}}”的结果", en: "Result from tool '{{name}}'" },
  "codemode.label.tool_arguments": { "zh-CN": "工具“{{name}}”的参数", en: "Arguments for tool '{{name}}'" },
  "codemode.error.invalid_tool_output": {
    "zh-CN": "工具“{{name}}”返回的输出无效。",
    en: "Invalid output from tool '{{name}}'.",
  },
  "codemode.error.tool_call_limit": {
    "zh-CN": "执行超过了 {{limit}} 次工具调用限制。",
    en: "Execution exceeded its tool-call limit of {{limit}}.",
  },
  "codemode.error.tool_input_arity": {
    "zh-CN": "工具“{{name}}”只能接收一个输入对象。",
    en: "Tool '{{name}}' expects exactly one input object.",
  },
  "codemode.error.invalid_tool_input": {
    "zh-CN": "工具“{{name}}”的输入无效：{{cause}}",
    en: "Invalid input for tool '{{name}}': {{cause}}",
  },
  "codemode.error.invalid_limit": {
    "zh-CN": "{{name}} 必须是大于或等于 {{minimum}} 的安全整数。",
    en: "{{name}} must be a safe integer greater than or equal to {{minimum}}.",
  },
  "codemode.error.code_empty": { "zh-CN": "代码不能为空。", en: "Code cannot be empty." },
  "codemode.interpreter.supported_syntax": {
    "zh-CN":
      "支持的编排语法：tools.* 调用（它们返回 Promise——请使用 await 解析）、数据字面量、解构、可选链、模板字面量、条件语句、switch、循环（包括对对象/数组/tools 键使用 for...of 和 for...in）、箭头函数、展开、try/catch、数组方法（map/filter/find/findIndex/some/every/reduce/flatMap/forEach/sort/slice/concat/indexOf/lastIndexOf/at/flat/reverse/includes/join）、字符串方法（包括配合正则表达式使用 match/matchAll/replace/split）、Date/RegExp/Map/Set/URL/URLSearchParams、URI 编码辅助函数、Object/Math/JSON 辅助函数、捕获的 console.log/warn/error/dir/table，以及对混合 Promise 和普通值的数组使用 Promise.all/allSettled/race/resolve/reject 进行并行工具调用（不支持使用 .then/.catch 的 Promise 链式调用——请使用 await 和 try/catch）。",
    en: "Supported orchestration syntax: tools.* calls (they return promises - resolve them with await), data literals, destructuring, optional chaining, template literals, conditionals, switch, loops (incl. for...of and for...in over object/array/tools keys), arrow functions, spread, try/catch, array methods (map/filter/find/findIndex/some/every/reduce/flatMap/forEach/sort/slice/concat/indexOf/lastIndexOf/at/flat/reverse/includes/join), string methods (incl. match/matchAll/replace/split with regular expressions), Date/RegExp/Map/Set/URL/URLSearchParams, URI encoding helpers, Object/Math/JSON helpers, captured console.log/warn/error/dir/table, and Promise.all/allSettled/race/resolve/reject over arrays mixing promises and plain values for parallel tool calls (promise chaining with .then/.catch is not supported - use await with try/catch).",
  },
  "codemode.interpreter.unsupported_syntax": {
    "zh-CN": "CodeMode 不支持语法“{{kind}}”。{{supported}}",
    en: "Syntax '{{kind}}' is not supported in CodeMode. {{supported}}",
  },
  "codemode.interpreter.invalid_ast_node": {
    "zh-CN": "读取 {{context}} 时遇到无效的 AST 节点。",
    en: "Invalid AST node while reading {{context}}.",
  },
  "codemode.interpreter.expected_array": { "zh-CN": "预期“{{key}}”为数组。", en: "Expected '{{key}}' to be an array." },
  "codemode.interpreter.expected_string": {
    "zh-CN": "预期“{{key}}”为字符串。",
    en: "Expected '{{key}}' to be a string.",
  },
  "codemode.interpreter.expected_boolean": {
    "zh-CN": "预期“{{key}}”为布尔值。",
    en: "Expected '{{key}}' to be a boolean.",
  },
  "codemode.interpreter.source_location": {
    "zh-CN": "（第 {{line}} 行，第 {{column}} 列）",
    en: " (line {{line}}, col {{column}})",
  },
  "codemode.stdlib.method_input": { "zh-CN": "{{name}} 输入", en: "{{name}} input" },
  "codemode.stdlib.method_result": { "zh-CN": "{{name}} 结果", en: "{{name}} result" },
  "codemode.stdlib.method_base": { "zh-CN": "{{name}} 基准 URL", en: "{{name}} base" },
  "codemode.stdlib.json_value": { "zh-CN": "JSON.stringify 值", en: "JSON.stringify value" },
  "codemode.stdlib.unavailable_static": {
    "zh-CN": "CodeMode 中不可使用 {{namespace}}.{{name}}。",
    en: "{{namespace}}.{{name}} is not available in CodeMode.",
  },
  "codemode.stdlib.unavailable_method": {
    "zh-CN": "CodeMode 中不可使用 {{namespace}} 方法“{{name}}”。",
    en: "{{namespace}} method '{{name}}' is not available in CodeMode.",
  },
  "codemode.stdlib.unavailable_method_generic": {
    "zh-CN": "CodeMode 中不可使用方法“{{name}}”。",
    en: "Method '{{name}}' is not available in CodeMode.",
  },
  "codemode.stdlib.expects_number_arguments": {
    "zh-CN": "{{name}} 只接受数值参数。",
    en: "{{name}} expects number arguments.",
  },
  "codemode.stdlib.expects_number_argument": {
    "zh-CN": "{{name}} 需要数值参数。",
    en: "{{name}} expects a number argument.",
  },
  "codemode.stdlib.regex_escape_hint": {
    "zh-CN":
      "若要按字面匹配 ( ) [ ] { } + * ? . 等特殊字符，请使用反斜杠转义（例如“\\\\(”），或使用 String.includes 检查它们。",
    en: 'To match special characters like ( ) [ ] { } + * ? . literally, escape them with a backslash (e.g. "\\\\(") or test for them with String.includes instead.',
  },
  "codemode.stdlib.regex_invalid_pattern": {
    "zh-CN": "String.{{method}} 收到字符串 {{value}}，它不是有效的正则表达式模式（{{cause}}）。{{hint}}",
    en: "String.{{method}} received the string {{value}}, which is not a valid regular expression pattern ({{cause}}). {{hint}}",
  },
  "codemode.stdlib.regex_expected": {
    "zh-CN":
      "String.{{method}} 需要正则表达式（/pattern/flags 字面量或 new RegExp(...)）或字符串模式，而不是 {{actual}}。",
    en: "String.{{method}} expects a regular expression (a /pattern/flags literal or new RegExp(...)) or a string pattern, not {{actual}}.",
  },
  "codemode.stdlib.object_expected": { "zh-CN": "{{name}} 需要数据对象。", en: "{{name}} expects a data object." },
  "codemode.stdlib.property_unavailable": {
    "zh-CN": "CodeMode 中不可使用属性“{{key}}”。",
    en: "Property '{{key}}' is not available in CodeMode.",
  },
  "codemode.stdlib.object_keys_expected": {
    "zh-CN": "Object.keys 需要数据对象或数组。",
    en: "Object.keys expects a data object or array.",
  },
  "codemode.stdlib.object_assign_expected": {
    "zh-CN": "Object.assign 需要数据对象。",
    en: "Object.assign expects data objects.",
  },
  "codemode.stdlib.object_entries_array_expected": {
    "zh-CN": "Object.fromEntries 需要 [key, value] 对数组。",
    en: "Object.fromEntries expects an array of [key, value] pairs.",
  },
  "codemode.stdlib.object_entry_expected": {
    "zh-CN": "Object.fromEntries 需要 [key, value] 对。",
    en: "Object.fromEntries expects [key, value] pairs.",
  },
  "codemode.stdlib.uri_malformed": {
    "zh-CN": "{{name}} 收到格式错误的 URI 数据：{{cause}}",
    en: "{{name}} received malformed URI data: {{cause}}",
  },
  "codemode.stdlib.url_argument_required": {
    "zh-CN": "{{name}} 需要 URL 参数。",
    en: "{{name}} requires a URL argument.",
  },
  "codemode.stdlib.json_replacer_unsupported": {
    "zh-CN": "CodeMode 不支持 JSON.stringify replacer。",
    en: "JSON.stringify replacers are not supported in CodeMode.",
  },
  "codemode.stdlib.json_parse_string": { "zh-CN": "JSON.parse 需要字符串。", en: "JSON.parse expects a string." },
  "codemode.stdlib.json_parse_invalid": {
    "zh-CN": "JSON.parse 收到无效 JSON：{{cause}}",
    en: "JSON.parse received invalid JSON: {{cause}}",
  },
  "codemode.stdlib.numeric_radix": { "zh-CN": "{{name}} 需要数值进制参数。", en: "{{name}} expects a numeric radix." },
  "codemode.stdlib.radix_range": {
    "zh-CN": "Number.toString 的进制必须介于 2 和 36 之间。",
    en: "Number.toString radix must be between 2 and 36.",
  },
  "codemode.stdlib.invalid_time": { "zh-CN": "时间值无效。", en: "Invalid time value." },
  "codemode.error.execution_timeout": {
    "zh-CN": "执行在 {{timeout}} 毫秒后超时。",
    en: "Execution timed out after {{timeout}}ms.",
  },
  "codemode.label.execution_result": { "zh-CN": "执行结果", en: "Execution result" },
  "codemode.openapi.transport_error": {
    "zh-CN": "{{method}} {{path}} 失败：传输错误",
    en: "{{method}} {{path}} failed: transport error",
  },
  "codemode.openapi.http_error": {
    "zh-CN": "{{method}} {{path}} 返回 HTTP {{status}} 错误：{{summary}}",
    en: "{{method}} {{path}} failed with HTTP {{status}}: {{summary}}",
  },
  "codemode.openapi.no_response_body": { "zh-CN": "无响应正文", en: "no response body" },
  "codemode.openapi.malformed_json": {
    "zh-CN": "{{method}} {{path}} 返回了格式错误的 JSON。",
    en: "{{method}} {{path}} returned malformed JSON.",
  },
  "codemode.openapi.missing_required_body_field": {
    "zh-CN": "缺少必需的正文字段“{{name}}”。",
    en: "Missing required body field '{{name}}'.",
  },
  "codemode.openapi.missing_required_parameter": {
    "zh-CN": "缺少必需的 {{location}} 参数“{{name}}”。",
    en: "Missing required {{location}} parameter '{{name}}'.",
  },
  "codemode.openapi.invalid_json_body": {
    "zh-CN": "{{method}} {{path}} 的 JSON 正文无效。",
    en: "Invalid JSON body for {{method}} {{path}}.",
  },
  "codemode.openapi.authentication_required": {
    "zh-CN": "{{method}} {{path}} 需要身份验证；以下项目没有可用凭据：{{names}}。",
    en: "{{method}} {{path}} requires authentication; no credential available for: {{names}}.",
  },
  "codemode.openapi.duplicate_authentication": {
    "zh-CN": "身份验证为 {{carrier}}“{{name}}”解析出了多个凭据。",
    en: "Authentication resolves multiple credentials for {{carrier}} '{{name}}'.",
  },
  "codemode.openapi.invalid_api_key_scheme": {
    "zh-CN": "安全方案“{{name}}”不是 apiKey 方案；请为其解析 bearer、basic 或 header 凭据。",
    en: "Security scheme '{{name}}' is not an apiKey scheme; resolve a bearer, basic, or header credential for it.",
  },
  "codemode.openapi.cookie_auth_unsupported": {
    "zh-CN": "不支持 Cookie 身份验证“{{name}}”。",
    en: "Cookie authentication '{{name}}' is not supported.",
  },
  "codemode.openapi.missing_path_parameter": {
    "zh-CN": "缺少必需的路径参数“{{name}}”。",
    en: "Missing required path parameter '{{name}}'.",
  },
  "codemode.openapi.invalid_path_parameter": {
    "zh-CN": "路径参数“{{name}}”无效。",
    en: "Invalid path parameter '{{name}}'.",
  },
  "codemode.openapi.unresolved_path_parameter": {
    "zh-CN": "未解析的路径参数 {{name}}。",
    en: "Unresolved path parameter {{name}}.",
  },
  "codemode.openapi.parameter_nested_unsupported": {
    "zh-CN": "参数“{{name}}”包含不受支持的嵌套值。",
    en: "Parameter '{{name}}' contains an unsupported nested value.",
  },
  "codemode.openapi.deep_object_requires_object": {
    "zh-CN": "深层对象参数“{{name}}”必须是对象。",
    en: "Deep-object parameter '{{name}}' must be an object.",
  },
  "codemode.openapi.deep_object_nested_unsupported": {
    "zh-CN": "深层对象参数“{{name}}”包含不受支持的嵌套值。",
    en: "Deep-object parameter '{{name}}' contains an unsupported nested value.",
  },
  "codemode.openapi.query_nested_unsupported": {
    "zh-CN": "查询参数“{{name}}”包含不受支持的嵌套值。",
    en: "Query parameter '{{name}}' contains an unsupported nested value.",
  },
  "codemode.openapi.response_too_large": {
    "zh-CN": "{{method}} {{path}} 的响应超过 50 MiB。",
    en: "{{method}} {{path}} response exceeds 50 MiB.",
  },
  "codemode.openapi.response_read_failed": {
    "zh-CN": "读取 {{method}} {{path}} 的响应正文时失败。",
    en: "{{method}} {{path}} failed while reading the response body.",
  },
  "codemode.openapi.spec.parameter_invalid": {
    "zh-CN": "参数声明无效或无法解析",
    en: "parameter declaration is invalid or unresolved",
  },
  "codemode.openapi.spec.parameter_missing_identity": {
    "zh-CN": "参数声明缺少名称或位置",
    en: "parameter declaration is missing name or location",
  },
  "codemode.openapi.spec.cookie_parameter_unsupported": {
    "zh-CN": "不支持 Cookie 参数“{{name}}”",
    en: "cookie parameter '{{name}}' is not supported",
  },
  "codemode.openapi.spec.cookie_auth_unsupported": {
    "zh-CN": "不支持 Cookie 身份验证“{{name}}”",
    en: "cookie authentication '{{name}}' is not supported",
  },
  "codemode.openapi.spec.parameter_location_unsupported": {
    "zh-CN": "参数“{{name}}”使用了不受支持的位置“{{location}}”",
    en: "parameter '{{name}}' uses unsupported location '{{location}}'",
  },
  "codemode.openapi.spec.parameter_schema_missing": {
    "zh-CN": "参数“{{name}}”既未声明 schema，也未声明 content",
    en: "parameter '{{name}}' declares neither schema nor content",
  },
  "codemode.openapi.spec.parameter_content_unsupported": {
    "zh-CN": "参数“{{name}}”使用了不受支持的 content 编码",
    en: "parameter '{{name}}' uses unsupported content encoding",
  },
  "codemode.openapi.spec.parameter_style_invalid": {
    "zh-CN": "参数“{{name}}”的 style 无效",
    en: "parameter '{{name}}' has an invalid style",
  },
  "codemode.openapi.spec.parameter_explode_invalid": {
    "zh-CN": "参数“{{name}}”的 explode 值无效",
    en: "parameter '{{name}}' has an invalid explode value",
  },
  "codemode.openapi.spec.parameter_allow_reserved_invalid": {
    "zh-CN": "参数“{{name}}”的 allowReserved 值无效",
    en: "parameter '{{name}}' has an invalid allowReserved value",
  },
  "codemode.openapi.spec.parameter_allow_reserved_unsupported": {
    "zh-CN": "参数“{{name}}”使用了不受支持的 allowReserved 编码",
    en: "parameter '{{name}}' uses unsupported allowReserved encoding",
  },
  "codemode.openapi.spec.query_style_unsupported": {
    "zh-CN": "查询参数“{{name}}”使用了不受支持的 style“{{style}}”",
    en: "query parameter '{{name}}' uses unsupported style '{{style}}'",
  },
  "codemode.openapi.spec.location_style_unsupported": {
    "zh-CN": "{{location}} 参数“{{name}}”使用了不受支持的 style“{{style}}”",
    en: "{{location}} parameter '{{name}}' uses unsupported style '{{style}}'",
  },
  "codemode.openapi.spec.deep_object_explode_false": {
    "zh-CN": "查询参数“{{name}}”使用 deepObject 且 explode=false",
    en: "query parameter '{{name}}' uses deepObject with explode=false",
  },
  "codemode.openapi.spec.body_no_json": {
    "zh-CN": "请求正文没有 JSON 内容（已声明：{{declared}}）",
    en: "request body has no JSON content (declared: {{declared}})",
  },
  "codemode.openapi.spec.none": { "zh-CN": "无", en: "none" },
  "codemode.openapi.spec.response_invalid": {
    "zh-CN": "成功响应声明无效或无法解析",
    en: "successful response declaration is invalid or unresolved",
  },
  "codemode.openapi.spec.websocket_unsupported": {
    "zh-CN": "不支持 WebSocket 操作",
    en: "WebSocket operations are not supported",
  },
  "codemode.openapi.spec.sse_unsupported": { "zh-CN": "不支持 SSE 操作", en: "SSE operations are not supported" },
  "codemode.openapi.spec.binary_unsupported": {
    "zh-CN": "不支持二进制响应",
    en: "binary responses are not supported",
  },
  "codemode.openapi.spec.no_servers": {
    "zh-CN": "规范未声明服务器；请传入 baseUrl",
    en: "spec declares no servers; pass baseUrl",
  },
  "codemode.openapi.spec.server_not_absolute": {
    "zh-CN": "服务器 URL“{{url}}”不是绝对 URL；请传入 baseUrl",
    en: "server URL '{{url}}' is not an absolute URL; pass baseUrl",
  },
  "codemode.openapi.spec.server_not_http": {
    "zh-CN": "服务器 URL“{{url}}”不是绝对 HTTP(S) URL",
    en: "server URL '{{url}}' is not an absolute HTTP(S) URL",
  },
  "codemode.openapi.spec.server_query_unsupported": {
    "zh-CN": "服务器 URL“{{url}}”包含不受支持的查询字符串或片段",
    en: "server URL '{{url}}' contains an unsupported query string or fragment",
  },
  "codemode.openapi.spec.security_not_array": {
    "zh-CN": "security 声明不是数组",
    en: "security declaration is not an array",
  },
  "codemode.openapi.spec.security_requirement_not_object": {
    "zh-CN": "security 要求不是对象",
    en: "security requirement is not an object",
  },
  "codemode.openapi.spec.security_scopes_invalid": {
    "zh-CN": "security 要求的 scopes 不是字符串数组",
    en: "security requirement scopes are not string arrays",
  },
  "codemode.openapi.spec.security_scheme_invalid": {
    "zh-CN": "security 要求引用了缺失或格式错误的方案：{{names}}",
    en: "security requirement references missing or malformed scheme: {{names}}",
  },
  "codemode.interpreter.parse_typescript_failed": {
    "zh-CN": "解析 TypeScript 失败：{{error}}",
    en: "Failed to parse TypeScript: {{error}}",
  },
  "codemode.interpreter.instanceof_constructor": {
    "zh-CN":
      "instanceof 的右侧必须是 CodeMode 已知的构造函数：Error（或 TypeError 等特定错误类型）、Date、RegExp、Map、Set、URL、URLSearchParams、Array、Object 或 Promise。",
    en: "The right-hand side of 'instanceof' must be a constructor CodeMode knows: Error (or a specific error type like TypeError), Date, RegExp, Map, Set, URL, URLSearchParams, Array, Object, or Promise.",
  },
  "codemode.stdlib.expects_string_argument_at": {
    "zh-CN": "{{name}} 需要第 {{index}} 个参数为字符串。",
    en: "{{name}} expects argument {{index}} to be a string.",
  },
  "codemode.stdlib.expects_number_argument_at": {
    "zh-CN": "{{name}} 需要第 {{index}} 个参数为数字。",
    en: "{{name}} expects argument {{index}} to be a number.",
  },
  "codemode.stdlib.string_normalize_form": {
    "zh-CN": 'String.normalize 需要格式为 "NFC"、"NFD"、"NFKC" 或 "NFKD"（收到 {{form}}）。',
    en: 'String.normalize expects the form "NFC", "NFD", "NFKC", or "NFKD" (got {{form}}).',
  },
  "codemode.stdlib.string_global_regex": {
    "zh-CN": "{{name}} 需要带全局 (g) 标志的正则表达式：请写成 {{pattern}}，或使用 {{alternative}} {{purpose}}。",
    en: "{{name}} requires a regular expression with the global (g) flag: write {{pattern}}, or use {{alternative}} {{purpose}}.",
  },
  "codemode.stdlib.first_match": { "zh-CN": "仅替换第一个匹配项", en: "to replace only the first match" },
  "codemode.stdlib.single_match": { "zh-CN": "获取单个匹配项", en: "for a single match" },
  "codemode.stdlib.string_repeat_count": {
    "zh-CN": "String.repeat 需要有限的非负计数。",
    en: "String.repeat expects a finite non-negative count.",
  },
  "codemode.stdlib.array_from_map": {
    "zh-CN": "CodeMode 中 Array.from(...) 不支持映射函数；请改为对结果调用 .map()。",
    en: "Array.from(...) does not support a map function in CodeMode; call .map() on the result instead.",
  },
  "codemode.stdlib.array_from_input": {
    "zh-CN": "Array.from 需要数组、字符串、Map、Set 或类数组值。",
    en: "Array.from expects an array, string, Map, Set, or array-like value.",
  },
  "codemode.interpreter.unexpected_control": {
    "zh-CN": "循环外出现意外的“{{kind}}”。",
    en: "Unexpected '{{kind}}' outside of a loop.",
  },
  "codemode.interpreter.for_await_unsupported": {
    "zh-CN": "不支持 for await...of。",
    en: "for await...of is not supported.",
  },
  "codemode.interpreter.for_of_value": {
    "zh-CN": "CodeMode 中 for...of 需要数组、字符串、Map 或 Set 值。",
    en: "for...of requires an array, string, Map, or Set value in CodeMode.",
  },
  "codemode.interpreter.for_of_binding_count": {
    "zh-CN": "for...of 仅支持一个声明绑定。",
    en: "for...of supports one declared binding.",
  },
  "codemode.interpreter.for_of_binding": { "zh-CN": "不支持此 for...of 绑定。", en: "Unsupported for...of binding." },
  "codemode.interpreter.for_in_binding_count": {
    "zh-CN": "for...in 仅支持一个声明绑定。",
    en: "for...in supports one declared binding.",
  },
  "codemode.interpreter.for_in_binding": { "zh-CN": "不支持此 for...in 绑定。", en: "Unsupported for...in binding." },
  "codemode.interpreter.labeled_break": {
    "zh-CN": "v1 不支持带标签的 break。",
    en: "Labeled break is not supported in v1.",
  },
  "codemode.interpreter.labeled_continue": {
    "zh-CN": "v1 不支持带标签的 continue。",
    en: "Labeled continue is not supported in v1.",
  },
  "codemode.interpreter.variable_declaration_shape": {
    "zh-CN": "不支持此变量声明结构。",
    en: "Unsupported variable declaration shape.",
  },
  "codemode.interpreter.named_destructuring_only": {
    "zh-CN": "仅支持具名对象解构属性。",
    en: "Only named object destructuring properties are supported.",
  },
  "codemode.interpreter.array_destructuring_value": {
    "zh-CN": "数组解构需要数组值。",
    en: "Array destructuring requires an array value.",
  },
  "codemode.interpreter.binding_pattern": {
    "zh-CN": "不支持绑定模式“{{type}}”。",
    en: "Unsupported binding pattern '{{type}}'.",
  },
  "codemode.interpreter.map_input": {
    "zh-CN": "new Map(...) 需要 [key, value] 对数组、Map 或不传参数。",
    en: "new Map(...) expects an array of [key, value] pairs, a Map, or no argument.",
  },
  "codemode.interpreter.map_pairs": {
    "zh-CN": "new Map(...) 需要 [key, value] 对。",
    en: "new Map(...) expects [key, value] pairs.",
  },
  "codemode.interpreter.set_input": {
    "zh-CN": "new Set(...) 需要数组、Set、字符串或不传参数。",
    en: "new Set(...) expects an array, Set, string, or no argument.",
  },
  "codemode.interpreter.url_input": {
    "zh-CN": "new URL(...) 需要 URL 字符串和可选的基础 URL。",
    en: "new URL(...) requires a URL string and an optional base URL.",
  },
  "codemode.interpreter.url_invalid": {
    "zh-CN": "new URL(...) 收到了无效 URL。",
    en: "new URL(...) received an invalid URL.",
  },
  "codemode.interpreter.url_or_base_invalid": {
    "zh-CN": "new URL(...) 收到了无效 URL 或基础 URL。",
    en: "new URL(...) received an invalid URL or base URL.",
  },
  "codemode.interpreter.url_search_params_pairs": {
    "zh-CN": "new URLSearchParams(...) 需要 [name, value] 对数组。",
    en: "new URLSearchParams(...) expects an array of [name, value] pairs.",
  },
  "codemode.interpreter.url_search_params_input": {
    "zh-CN": "new URLSearchParams(...) 需要查询字符串、数据对象、对数组或 URLSearchParams。",
    en: "new URLSearchParams(...) expects a query string, data object, array of pairs, or URLSearchParams.",
  },
  "codemode.interpreter.binary_data": {
    "zh-CN": "CodeMode 中二元运算符需要数据值。",
    en: "Binary operators require data values in CodeMode.",
  },
  "codemode.interpreter.binary_result": { "zh-CN": "二元表达式结果", en: "Binary expression result" },
  "codemode.interpreter.in_rhs": {
    "zh-CN": "in 运算符需要右侧为数据对象。",
    en: "The 'in' operator requires a data object on the right-hand side.",
  },
  "codemode.interpreter.binary_operator": {
    "zh-CN": "不支持二元运算符“{{operator}}”。",
    en: "Unsupported binary operator '{{operator}}'.",
  },
  "codemode.interpreter.logical_operator": {
    "zh-CN": "不支持逻辑运算符“{{operator}}”。",
    en: "Unsupported logical operator '{{operator}}'.",
  },
  "codemode.interpreter.unary_data": {
    "zh-CN": "CodeMode 中一元运算符需要数据值。",
    en: "Unary operators require data values in CodeMode.",
  },
  "codemode.interpreter.unary_operator": {
    "zh-CN": "不支持一元运算符“{{operator}}”。",
    en: "Unsupported unary operator '{{operator}}'.",
  },
  "codemode.interpreter.unary_result": { "zh-CN": "一元表达式结果", en: "Unary expression result" },
  "codemode.interpreter.assignment_result": { "zh-CN": "赋值结果", en: "Assignment result" },
  "codemode.interpreter.assignment_target": {
    "zh-CN": "赋值目标必须是 Identifier 或 MemberExpression。",
    en: "Assignment target must be an Identifier or MemberExpression.",
  },
  "codemode.interpreter.update_operator": {
    "zh-CN": "不支持更新运算符“{{operator}}”。",
    en: "Unsupported update operator '{{operator}}'.",
  },
  "codemode.interpreter.update_target": {
    "zh-CN": "更新目标必须是 Identifier 或 MemberExpression。",
    en: "Update target must be an Identifier or MemberExpression.",
  },
  "codemode.interpreter.tools_root_not_callable": {
    "zh-CN": "tools 根对象不可调用。",
    en: "The tools root is not callable.",
  },
  "codemode.interpreter.only_tools_callable": {
    "zh-CN": "CodeMode 中仅工具可调用。",
    en: "Only tools are callable in CodeMode.",
  },
  "codemode.stdlib.invalid_replacement_match": {
    "zh-CN": "{{name}} 生成了无效的替换匹配。",
    en: "{{name}} produced an invalid replacement match.",
  },
  "codemode.stdlib.expects_callback": {
    "zh-CN": "{{name}} 需要函数回调。",
    en: "{{name}} expects a function callback.",
  },
  "codemode.stdlib.array_expects_number": {
    "zh-CN": "{{name}} 需要 {{label}} 为数字。",
    en: "{{name}} expects {{label}} to be a number.",
  },
  "codemode.stdlib.array_join_arguments": {
    "zh-CN": "Array.join 需要零个参数或一个字符串分隔符。",
    en: "Array.join expects zero arguments or one string separator.",
  },
  "codemode.stdlib.array_includes_arguments": {
    "zh-CN": "Array.includes 需要一个值和可选的起始索引。",
    en: "Array.includes expects a value and optional start index.",
  },
  "codemode.stdlib.array_with_range": { "zh-CN": "Array.with 索引超出范围。", en: "Array.with index is out of range." },
  "codemode.stdlib.array_reduce_empty": {
    "zh-CN": "{{name}} 无法在没有初始值时处理空数组。",
    en: "{{name}} of an empty array with no initial value.",
  },
  "codemode.stdlib.array_sort_callback": {
    "zh-CN": "Array.sort 需要箭头函数比较器。",
    en: "Array.sort expects an arrow function comparator.",
  },
  "codemode.interpreter.standard_object_properties": {
    "zh-CN": "仅支持标准对象属性。",
    en: "Only standard object properties are supported.",
  },
  "codemode.interpreter.init_object_properties": {
    "zh-CN": "仅支持 init 对象属性。",
    en: "Only init object properties are supported.",
  },
  "codemode.interpreter.object_key_shape": {
    "zh-CN": "不支持此对象属性键结构。",
    en: "Unsupported object property key shape.",
  },
  "codemode.interpreter.template_quasi": { "zh-CN": "模板字面量 quasi 无效。", en: "Invalid template literal quasi." },
  "codemode.interpreter.assignment_operator": {
    "zh-CN": "不支持赋值运算符“{{operator}}”。",
    en: "Unsupported assignment operator '{{operator}}'.",
  },
  "codemode.interpreter.tool_path_property": {
    "zh-CN": "工具路径必须使用安全的字符串属性名。",
    en: "Tool paths must use safe string property names.",
  },
  "codemode.interpreter.property_non_object": {
    "zh-CN": "无法访问非对象值的属性。",
    en: "Cannot access a property on a non-object value.",
  },
  "codemode.interpreter.assign_data_fields": {
    "zh-CN": "CodeMode 中只能为数据字段赋值。",
    en: "Only data fields may be assigned in CodeMode.",
  },
  "codemode.interpreter.assign_array_length": {
    "zh-CN": "CodeMode 中不能为数组长度赋值。",
    en: "Array length cannot be assigned in CodeMode.",
  },
  "codemode.interpreter.assign_array_method": {
    "zh-CN": "CodeMode 中不能为数组方法赋值。",
    en: "Array methods cannot be assigned in CodeMode.",
  },
  "codemode.interpreter.url_read_only": {
    "zh-CN": "URL.{{property}} 为只读属性。",
    en: "URL.{{property}} is read-only.",
  },
  "codemode.interpreter.url_invalid_property": {
    "zh-CN": "URL.{{property}} 收到了无效值。",
    en: "URL.{{property}} received an invalid value.",
  },
  "codemode.interpreter.property_key_type": {
    "zh-CN": "属性键必须是字符串或数字。",
    en: "Property key must be a string or number.",
  },
  "codemode.interpreter.identifier_declared": {
    "zh-CN": "标识符“{{name}}”已声明。",
    en: "Identifier '{{name}}' has already been declared.",
  },
  "codemode.interpreter.identifier_unknown": {
    "zh-CN": "未知标识符“{{name}}”。",
    en: "Unknown identifier '{{name}}'.",
  },
  "codemode.interpreter.identifier_tdz": {
    "zh-CN": "初始化前无法访问“{{name}}”。",
    en: "Cannot access '{{name}}' before initialization.",
  },
  "codemode.interpreter.constant_assignment": {
    "zh-CN": "无法为常量“{{name}}”赋值。",
    en: "Cannot assign to constant '{{name}}'.",
  },
  "codemode.interpreter.scope_stack_empty": {
    "zh-CN": "解释器作用域栈为空。",
    en: "Interpreter scope stack is empty.",
  },
  "codemode.interpreter.generator_unsupported": {
    "zh-CN": "CodeMode 不支持生成器函数。",
    en: "Generator functions are not supported in CodeMode.",
  },
  "codemode.interpreter.switch_discriminant_data": {
    "zh-CN": "CodeMode 中 switch 判别式必须是数据值。",
    en: "Switch discriminants must be data values in CodeMode.",
  },
  "codemode.interpreter.switch_case_data": {
    "zh-CN": "CodeMode 中 switch case 值必须是数据值。",
    en: "Switch case values must be data values in CodeMode.",
  },
  "codemode.interpreter.for_in_value": {
    "zh-CN":
      "CodeMode 中 for...in 需要普通对象、数组或 tools 引用。数组、字符串、Map、Set 请使用 for...of；键列表请使用 Object.keys(value)。",
    en: "for...in requires a plain object, array, or tools reference in CodeMode. Use for...of for arrays/strings/Maps/Sets, or Object.keys(value) for a key list.",
  },
  "codemode.interpreter.object_destructuring_value": {
    "zh-CN": "对象解构需要数据对象值。",
    en: "Object destructuring requires a data object value.",
  },
  "codemode.interpreter.new_promise_unsupported": {
    "zh-CN": "CodeMode 不支持 new Promise(...)；工具调用已经返回 Promise，请调用工具并等待结果。",
    en: "new Promise(...) is not supported in CodeMode; tool calls already return promises - call the tool and await the result.",
  },
  "codemode.interpreter.regexp_flags_type": {
    "zh-CN": 'RegExp 标志必须是标志字符组成的字符串（例如 "g"、"gi"），不能是 {{actual}}。',
    en: 'RegExp flags must be a string of flag characters (e.g. "g", "gi"), not {{actual}}.',
  },
  "codemode.interpreter.regexp_flags_invalid": {
    "zh-CN": "new RegExp(...) 收到了无效标志 {{flags}}（{{reason}}）。有效标志为 d、g、i、m、s、u、v、y。",
    en: "new RegExp(...) received invalid flags {{flags}} ({{reason}}). Valid flags are d, g, i, m, s, u, v, and y.",
  },
  "codemode.interpreter.regexp_pattern_invalid": {
    "zh-CN": "new RegExp(...) 收到了无效正则表达式模式 {{pattern}}（{{reason}}）。{{hint}}",
    en: "new RegExp(...) received {{pattern}}, which is not a valid regular expression pattern ({{reason}}). {{hint}}",
  },
  "codemode.interpreter.object_tool_reference": {
    "zh-CN":
      "Object.{{name}}(...) 无法读取工具引用：它们不是普通数据。请使用 Object.keys(tools) 获取名称，或使用 tools.$codemode.search({ query }) 获取签名。",
    en: "Object.{{name}}(...) cannot read tool references: they are not plain data. Use Object.keys(tools) for names, or tools.$codemode.search({ query }) for signatures.",
  },
  "codemode.interpreter.spread_arguments": {
    "zh-CN": "CodeMode 中展开参数需要数组、字符串、Map 或 Set。",
    en: "Spread arguments require an array, string, Map, or Set in CodeMode.",
  },
  "codemode.interpreter.promise_array": {
    "zh-CN":
      "Promise.{{name}} 需要 Promise 或普通值组成的数组（例如 Promise.{{name}}(items.map((item) => tools.ns.tool(item)))）。",
    en: "Promise.{{name}} expects an array of promises or plain values (e.g. Promise.{{name}}(items.map((item) => tools.ns.tool(item)))).",
  },
  "codemode.interpreter.promise_race_empty": {
    "zh-CN": "Promise.race([]) 永远不会完成；请至少提供一个 Promise 或值。",
    en: "Promise.race([]) would never settle; provide at least one promise or value.",
  },
  "codemode.stdlib.requires_arguments": {
    "zh-CN": "{{name}} 需要 {{count}} 个参数。",
    en: "{{name}} requires {{count}} argument{{suffix}}.",
  },
  "codemode.interpreter.object_spread_data": {
    "zh-CN": "CodeMode 中对象展开需要数据对象。",
    en: "Object spread requires a data object in CodeMode.",
  },
  "codemode.interpreter.array_spread_value": {
    "zh-CN": "CodeMode 中数组展开需要数组、字符串、Map 或 Set。",
    en: "Array spread requires an array, string, Map, or Set in CodeMode.",
  },
  "codemode.interpreter.promise_method_unavailable": {
    "zh-CN":
      "CodeMode 中不可使用 Promise.{{name}}。可用方法：Promise.all、Promise.allSettled、Promise.race、Promise.resolve、Promise.reject；请使用 await 获取 Promise 结果。",
    en: "Promise.{{name}} is not available in CodeMode. Available: Promise.all, Promise.allSettled, Promise.race, Promise.resolve, and Promise.reject; consume promises with await.",
  },
  "codemode.interpreter.promise_chain_unsupported": {
    "zh-CN":
      "CodeMode 不支持 Promise.prototype.{{name}}；请改用 await（并使用 try/catch 处理失败），例如 `const result = await tools.ns.tool(...)`。",
    en: "Promise.prototype.{{name}} is not supported in CodeMode; use await instead (with try/catch to handle failures) - e.g. `const result = await tools.ns.tool(...)`.",
  },
  "codemode.interpreter.promise_property_unawaited": {
    "zh-CN": "此值是尚未等待的 Promise，没有可读属性；请先等待它，例如 `const result = await tools.ns.tool(...)`。",
    en: "This value is an un-awaited Promise and has no readable properties; await it first - e.g. `const result = await tools.ns.tool(...)`.",
  },
  "codemode.interpreter.runtime_reference_opaque": {
    "zh-CN": "CodeMode 运行时引用是不透明的，不公开属性。",
    en: "CodeMode runtime references are opaque and do not expose properties.",
  },
  "codemode.console.promise": {
    "zh-CN": "[Promise（请 await 以获取其值）]",
    en: "[Promise (await it to get its value)]",
  },
  "codemode.console.reference": { "zh-CN": "[CodeMode 引用]", en: "[CodeMode reference]" },
  "codemode.console.circular": { "zh-CN": "[循环引用]", en: "[Circular]" },
  "codemode.console.index": { "zh-CN": "（索引）", en: "(index)" },
  "codemode.argument.index": { "zh-CN": "索引", en: "index" },
  "codemode.argument.start": { "zh-CN": "起始位置", en: "start" },
  "codemode.argument.end": { "zh-CN": "结束位置", en: "end" },
  "codemode.argument.depth": { "zh-CN": "深度", en: "depth" },
  "codemode.argument.start_index": { "zh-CN": "起始索引", en: "start index" },
  "codemode.argument.delete_count": { "zh-CN": "删除数量", en: "delete count" },
  "codemode.argument.target_index": { "zh-CN": "目标索引", en: "target index" },
  "codemode.interpreter.array_assignment_index": {
    "zh-CN": "数组赋值索引必须是非负整数。",
    en: "Array assignment index must be a non-negative integer.",
  },
  "codemode.interpreter.literal": { "zh-CN": "字面量", en: "Literal" },
  "codemode.interpreter.url_search_params_name": { "zh-CN": "URLSearchParams 名称", en: "URLSearchParams name" },
  "codemode.interpreter.url_search_params_value": { "zh-CN": "URLSearchParams 值", en: "URLSearchParams value" },
  "codemode.interpreter.console_table_argument": { "zh-CN": "console.table 参数", en: "console.table argument" },
  "codemode.interpreter.console_table_columns": { "zh-CN": "console.table 列", en: "console.table columns" },
  "codemode.interpreter.string_replacer_result": { "zh-CN": "{{name}} 替换器结果", en: "{{name}} replacer result" },
  "codemode.interpreter.method_argument": {
    "zh-CN": "{{name}} 的第 {{index}} 个参数",
    en: "{{name}} argument {{index}}",
  },
  "codemode.interpreter.template_interpolation": { "zh-CN": "模板插值", en: "Template interpolation" },
  "codemode.interpreter.property_value": { "zh-CN": "{{name}} 值", en: "{{name}} value" },
  "codemode.interpreter.object_assignment_result": { "zh-CN": "对象赋值结果", en: "Object assignment result" },
  "codemode.interpreter.array_assignment_result": { "zh-CN": "数组赋值结果", en: "Array assignment result" },
  "codemode.interpreter.parse_program_failed": {
    "zh-CN": "无法将脚本解析为 Program 节点。",
    en: "Failed to parse script as a Program node.",
  },
  "codemode.interpreter.uncaught": { "zh-CN": "未捕获：{{message}}", en: "Uncaught: {{message}}" },
  "codemode.interpreter.non_data_value": { "zh-CN": "非数据值", en: "a non-data value" },
  "codemode.interpreter.maximum_nesting": {
    "zh-CN": "执行超过了最大嵌套深度。",
    en: "Execution exceeded the maximum nesting depth.",
  },
  "codemode.interpreter.unhandled_rejection": {
    "zh-CN": "未等待的工具调用产生了未处理的拒绝：{{message}}",
    en: "Unhandled rejection from an un-awaited tool call: {{message}}",
  },
  "codemode.interpreter.await_tool_hint": {
    "zh-CN": "请等待工具调用——`const result = await tools.ns.tool(...)`——以便捕获并处理失败。",
    en: "Await tool calls - `const result = await tools.ns.tool(...)` - so failures can be caught and handled.",
  },
  "codemode.interpreter.race_interrupted": {
    "zh-CN": "由于另一个值先完成了 Promise.race，此工具调用已中断。",
    en: "This tool call was interrupted because another value settled a Promise.race first.",
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
