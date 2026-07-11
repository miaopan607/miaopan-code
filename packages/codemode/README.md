# @miaopan-code/codemode

语言：简体中文 · [English](README.en.md)

基于 Effect、通过显式且由 Schema 描述的工具执行受限代码。

CodeMode 让模型编写一小段 JavaScript 程序，该程序只能调用宿主提供的工具。程序可以对调用排序、转换普通数据、分支、循环，并行运行相互独立的调用，同时不会获得环境中的文件系统、进程、网络、模块或应用权限。

此包目前仅供本工作区内部使用。其 API 围绕单次执行和可复用执行设计：

```ts
// 单次执行
yield * CodeMode.execute({ tools, code })

// 可复用的运行时
const runtime = CodeMode.make({ tools, limits })
yield * runtime.execute(code)
```

## 安装

在本工作区内：

```json
{
  "dependencies": {
    "@miaopan-code/codemode": "workspace:*"
  }
}
```

宿主通过 `effect` 与 CodeMode 交互（工具 `run` 实现、`Effect` 类型的结果），因此宿主自身也应依赖 `effect`。

## 快速开始

使用 Effect Schema 定义工具，然后将其放入以 `tools` 形式暴露给程序的对象树中：

```ts
import { CodeMode, Tool } from "@miaopan-code/codemode"
import { Effect, Schema } from "effect"

const lookupOrder = Tool.make({
  description: "Look up an order by ID",
  input: Schema.Struct({ id: Schema.String }),
  output: Schema.Struct({ id: Schema.String, status: Schema.String }),
  run: ({ id }) => Effect.succeed({ id, status: "open" }),
})

const runtime = CodeMode.make({
  tools: {
    orders: {
      lookup: lookupOrder,
    },
  },
})

const result =
  yield *
  runtime.execute(`
  const order = await tools.orders.lookup({ id: "order_42" })
  return { id: order.id, needsAttention: order.status !== "complete" }
`)
```

`result` 始终是 `CodeMode.Result`。程序、验证、限制和工具失败会以诊断形式返回，而不会使 Effect 失败。宿主中断仍保持为中断。

成功结果值是 JSON 安全数据。程序返回 `undefined`（包括执行到结尾但没有 `return`）时会产生 `null`；嵌套的 `undefined` 值同样会规范化为 `null`。

## API

### `Tool.make`

```ts
const tool = Tool.make({
  description,
  input, // Effect Schema（验证）或 JSON Schema（仅渲染）
  output, // 可选；选择同上
  run,
})
```

`input` 和 `output` 都接受验证型 Effect Schema 或仅渲染型 JSON Schema 文档（对于 Schema 以 JSON Schema 形式传入的适配器工具，例如 MCP 定义，这是自然结构）。在调用 `run` 前会解码 Effect Schema 输入；`run` 返回 Effect Schema `output` 的编码表示，CodeMode 会先将其解码并复制，再暴露给程序。JSON Schema 只决定模型可见签名的结构；值不会经过验证而直接传递（但仍会跨越普通数据边界）。

`output` 是可选的。省略时，工具签名会声明 `Promise<unknown>`，宿主结果将按原样暴露。

描述和 Schema 是模型可见工具契约的一部分。请让描述具体明确，并将授权逻辑放在 `run` 或其调用的服务中。

公共工具类型归入同一命名空间：`Tool.Definition`、`Tool.Options`、`Tool.SchemaType` 和 `Tool.JsonSchema`。

### `CodeMode.execute`

使用 `CodeMode.execute` 进行单次执行：

```ts
const result =
  yield *
  CodeMode.execute({
    tools: { orders: { lookup: lookupOrder } },
    code: `return await tools.orders.lookup({ id: "order_42" })`,
    limits: { maxToolCalls: 10 },
    onToolCallStart: (call) => Effect.logDebug("CodeMode tool started", call),
    onToolCallEnd: (call) => Effect.logDebug("CodeMode tool settled", call),
  })
```

Effect 环境会根据提供的工具推导。CodeMode 不会抹除工具实现引入的服务要求。

### `CodeMode.make`

当工具集和执行策略需要复用时，请使用 `CodeMode.make`：

```ts
const runtime = CodeMode.make({
  tools: { orders: { lookup: lookupOrder } },
  limits: { timeoutMs: 30_000 },
})

runtime.catalog() // 结构化工具描述
runtime.instructions() // 面向模型的语法和工具指南
runtime.execute(source) // CodeMode.Result
```

`CodeMode.Input`、`CodeMode.Result`、`CodeMode.Success`、`CodeMode.Failure`、`CodeMode.Diagnostic` 和 `CodeMode.DiagnosticKind` 既是 Effect Schema，也是由其推导的 TypeScript 类型。宿主构造框架专用代理工具时，可以将 `CodeMode.Input` 和 `CodeMode.Result` 与 `runtime.instructions()`、`runtime.execute()` 组合使用。

所有其他 CodeMode 类型也使用同一命名空间：`CodeMode.Options`、`CodeMode.ExecuteOptions`、`CodeMode.Runtime`、`CodeMode.ExecutionLimits`、`CodeMode.DiscoveryOptions`、`CodeMode.DataValue`、`CodeMode.ToolDescription` 以及 `CodeMode.ToolCall*` 观测类型。

### 结果

```ts
type Result = Success | Failure

interface Success {
  readonly ok: true
  readonly value: CodeMode.DataValue
  readonly logs?: ReadonlyArray<string>
  readonly truncated?: boolean
  readonly toolCalls: ReadonlyArray<CodeMode.ToolCall>
}

interface Failure {
  readonly ok: false
  readonly error: CodeMode.Diagnostic
  readonly logs?: ReadonlyArray<string>
  readonly truncated?: boolean
  readonly toolCalls: ReadonlyArray<CodeMode.ToolCall>
}
```

`toolCalls` 按调用顺序包含运行时接纳的调用名称。失败时仍会保留它，以便宿主在不暴露输入或宿主失败的情况下审计部分执行。值或日志为了符合 `maxOutputBytes` 而被裁剪时会出现 `truncated`（参见“执行限制”）。

### 工具调用钩子

输入解码后、工具执行前，`onToolCallStart` 会收到 `{ index, name, input }`。输入是宿主侧解码后的数据，可能包含由 Schema 转换产生的值；应用不应不加选择地记录敏感工具参数。

接纳的调用结束时，`onToolCallEnd` 会收到 `{ index, name, input, durationMs, outcome, message? }`。`outcome` 为 `"success"` 或 `"failure"`；`message` 是对模型安全的失败消息，仅在失败时存在。被中断的调用（例如执行超时触发时）不会产生结束事件。两个钩子都返回 Effect，且不得失败。

### OpenAPI 工具

`OpenAPI.fromSpec` 将 OpenAPI 3.x 文档转换为工具子树——每个操作对应一个工具。带点号的 `operationId` 值形成 `v2.session.get` 等命名空间。缺少 ID 时会使用 `getUsersById` 这类扁平的方法/路径回退名称；名称会被清理并去重。宿主将子树放在其 `tools` 树的某个 key 下；该 key 就是模型可见命名空间。

```ts
import { CodeMode, OpenAPI } from "@miaopan-code/codemode"
import { Effect } from "effect"
import { FetchHttpClient } from "effect/unstable/http"

const api = OpenAPI.fromSpec({
  spec: await Bun.file("openapi.json").json(), // 已解析文档（不支持 YAML）
  auth: {
    resolve: ({ name, scopes, operation }) =>
      name === "BearerAuth" ? Effect.succeed({ type: "bearer", token }) : Effect.succeed(undefined),
  },
})

const runtime = CodeMode.make({ tools: { miaopan-code: api.tools } })
const result = await Effect.runPromise(runtime.execute(code).pipe(Effect.provide(FetchHttpClient.layer)))
```

`fromSpec` 是同步函数，返回 `{ tools, skipped }`。初始适配器支持查询参数的 `form`/`deepObject`、路径/标头参数的 `simple`、JSON 请求体、JSON 响应和文本响应；不受支持的参数编码、非 JSON 请求体、二进制响应和流式操作会进入 `skipped`，而不是生成不可用的工具。操作服务器和路径服务器优先于文档服务器，除非 `baseUrl` 明确覆盖所有服务器。工具输入将路径、查询、标头和封闭对象请求体字段扁平化为一个面向模型的对象，同时在内部保留它们的 HTTP 位置。跨位置名称冲突会获得 `path_id`、`query_id` 等位置前缀；组合型、可空、字典、条件必填和非对象 JSON 请求体仍保留在 `body` 下。认证永远不会对模型可见。响应限制为 50 MiB，非 2xx 响应会转为安全的工具失败，并携带状态和受大小限制的响应体摘要。延期功能记录在 `src/openapi/TODO.md` 中。

受支持的 bearer、basic、标头和查询认证遵循 OpenAPI `security` 语义，并由宿主侧的 `auth.resolve` 解析——凭据存储、OAuth 流程和 token 刷新永远不会进入编译器。Cookie 认证备选项会被丢弃；如果操作没有受支持的备选项，该操作会被跳过。完整语义参见 `src/openapi/types.ts` 中的选项文档字符串。生成的工具要求 Effect 环境中存在 `HttpClient.HttpClient`（来自 `effect/unstable/http`）——执行时请提供 `FetchHttpClient.layer` 或自定义/测试客户端层。所提供的客户端拥有重定向策略；对需要凭据的主机，应在源发生变化时拒绝重定向或移除凭据。

## 发现

代理工具指令使用受预算限制的目录。无论预算如何，每个工具命名空间始终会连同工具数量一起列出；在估算 token 预算内会内联尽可能多的完整、带 JSDoc 注释的工具签名（每个附带一行描述）。Schema 字段描述和标签也计入各签名的成本。为保证公平，选择过程按命名空间轮询：在每轮中（命名空间按字母排序），每个仍有未内联工具的命名空间都会尝试将其下一个成本最低的签名放入共享预算；下一个签名无法容纳的命名空间退出，其他命名空间继续——因此，在任何命名空间获得全部表示前，每个命名空间都会先获得一些表示。指令会准确说明列表的完备程度，包括整体（`COMPLETE list` 与 `PARTIAL - N of M shown`）和每个命名空间（`(3 tools)`、`(3 tools, 1 shown)`、`(3 tools, none shown)`）。

目录条目预算默认为 2,000 个估算 token（字符数 / 4，与 miaopan-code 使用相同的启发式算法）。它只应用于目录中展示的完整工具条目；固定指令和命名空间摘要不计入。构造运行时时可以覆盖它：

```ts
const runtime = CodeMode.make({
  tools,
  discovery: { catalogBudget: 6_000 },
})
```

预算必须是非负安全整数。

运行时搜索工具始终会注册——包括目录已完整内联时——因此试探性调用 `tools.$codemode.search` 永远不会因未知工具而失败。它只在内联列表不完整时出现在指令中：

```ts
const matches = await tools.$codemode.search({
  query: "order status",
  namespace: "orders", // 可选：限定到一个顶级命名空间
  limit: 10,
  offset: 0,
})
```

`search` 执行确定性的累加字段加权匹配。查询会被分词（拆分 camelCase 边界；每个非字母数字字符都是分隔符；丢弃空项和 `*`），每个词项为每个工具计分：精确路径或路径段匹配（20）、路径子字符串（8）、描述子字符串（4）和可搜索文本子字符串（2）。每个词项还带有简单的单数变体（移除末尾 `s`/`es`）；词项或其任一变体匹配时，字段检查即通过——因此复数查询词（`issues`）仍能找到文本中只出现 `issue` 的工具，而不会改变权重。可搜索文本还包括输入 Schema 的属性名称及描述字符串，因此，以参数命名的查询能找到对应工具；子字符串匹配也意味着部分单词可以匹配。各词项得分相加；匹配项按得分排序（并列时按路径字母顺序），然后从基于零的 `offset`（默认 0）切片到配置的 `limit`（默认 10）。`remaining` 统计当前页之后的匹配项。存在下一页时，`next` 为 `{ offset }`；最后一页为 `null`。请将其展开到原始请求中，以保留查询、命名空间和限制。

```ts
const request = { query: "order status", namespace: "orders", limit: 10 }
const page = await tools.$codemode.search(request)
const nextPage = page.next ? await tools.$codemode.search({ ...request, ...page.next }) : undefined
```

每个结果都包含路径、描述以及内联目录所用的同一份生成 TypeScript 签名，因此无需二次查找。签名使用带 JSDoc 注释的多行形式：每个有描述的输入/输出字段都以 `/** ... */` 注释携带其 Schema `description`，TypeScript 无法表达的约束则以标签形式附带（`@deprecated`、`@default`、`@format`、`@minItems`、`@maxItems`）。

```ts
tools.github.list_issues(input: {
  /** Repository owner */
  owner: string,
  /** Cursor from the previous response's pageInfo */
  after?: string,
  /**
   * Results per page
   * @default 30
   */
  perPage?: number,
}): Promise<unknown>
```

结果路径会渲染为以 `tools` 为根的 JavaScript 表达式（`tools.orders.lookup`，对于非标识符路径段则是 `tools.context7["resolve-library-id"]`），因此每个 `path` 都能直接作为调用位置。空查询会按路径字母顺序浏览目录；结合 `namespace`（`{ query: "", namespace: "orders" }`）时，它会列出该命名空间中的所有内容。精确命名一个工具路径（标准路径、带 `tools.` 前缀的路径或渲染后的 JavaScript 表达式）的查询会被视为查找，并且只返回该工具。

指令采用结构化 Markdown，并按工作流在顶部、目录在底部的顺序组织：`## Workflow` 部分包含编号步骤（目录不完整时通过搜索寻找工具，完整时从内联列表中选择；按原样调用准确路径；只返回需要的字段）；`## Rules` 部分只包含工作流尚未覆盖的指导（`tools` 中只存在列出/搜索结果中的 Code Mode 工具和内部运行时工具；在代码中过滤和聚合集合；运行时收窄 `Promise<unknown>` 结果；通过 `Promise.all` 运行独立调用；使用 `Object.keys`/`for...in` 枚举 `tools`；搜索可用时浏览命名空间并对搜索结果分页）；简短的 `## Language` 部分说明运行时是一种受限 JavaScript 编排语言，并列出主要不可用功能；最后是受预算限制的 `## Available tools` 目录。示例调用形式使用显式 `<namespace>.<tool>`/`<field>` 占位符——绝不使用真实或虚构的工具名称。

宿主不能定义自己的 `$codemode` 顶级命名空间。

## 支持的程序

CodeMode 执行经过刻意限制的 JavaScript 子集。它支持：

- 普通数据字面量、属性访问、赋值和解构。
- `if`、条件表达式、`switch`、`for`、`for...of`（数组、字符串、Map、Set）、`for...in`（普通对象的自有 key、数组索引字符串，以及 `tools` 引用的命名空间/工具名称——其他值会产生错误并建议使用 `for...of` 或 `Object.keys`，而不会采用真实 JS 对字符串枚举索引、对 Map/Set 零次迭代这种意外行为）、`while` 和 `do...while`。
- 带闭包、默认参数、剩余参数和解构的箭头函数及函数声明。
- 可选链、空值合并、模板、展开（数组、字符串、Map、Set）以及 `try`/`catch`。
- 常用的数组、字符串、数字、`Object`、`Math` 和 `JSON` 操作。会修改数组的方法包括 `push`/`pop`/`shift`/`unshift`/`splice`（原地移除并返回被移除元素）/`fill`/`copyWithin`；数组的 `keys`/`values`/`entries` 返回**数组**（与 Map/Set 约定一致），可与 `for...of` 和展开配合使用。字符串方法包括 `localeCompare`（忽略 locale/options 参数）、`normalize` 和 `trimLeft`/`trimRight` 别名。`Object.keys` 也接受数组（与 JS 一样返回索引字符串）和工具引用：`Object.keys(tools)` 列出包括 `$codemode` 在内的顶级命名空间，`Object.keys(tools.ns)` 列出该节点的名称（可调用工具枚举为 `[]`；未知路径产生 `UnknownTool` 诊断）。对工具引用使用 `Object.values`/`Object.entries` 会失败，并提示使用 `Object.keys(tools)` 和 `tools.$codemode.search`。
- `Date`——`Date.now()`/`Date.parse()`/`Date.UTC()`、`new Date(...)`、getter 方法，以及通过时间值进行日期算术/比较。日期序列化为 ISO（包括 `toString`，确保不同宿主时区下的确定性）。
- 正则表达式——`/literals/` 和带 `test`/`exec` 的 `new RegExp(...)`（`g` 使用有状态的 `lastIndex`），以及字符串的 `match`/`matchAll`/`replace`/`replaceAll`/`split`/`search` 模式操作。匹配结果是带有自有属性 `index` 和命名 `groups` 的数组（省略 `input`）。`replace` 和 `replaceAll` 接受函数替换器，参数包含捕获项、偏移量、输入和命名组；回调按顺序运行，可以等待工具调用，其结果会被强制转换为字符串。无效模式、无效 flag 和缺少 `g` 的调用会产生可捕获错误，说明错误原因和修复方法（转义提示、应编写的准确 `/pattern/g`）。模式在宿主引擎上运行，因此病态回溯只受执行超时限制。
- `Map` 和 `Set`——从条目/数组/字符串构造，支持 `get`/`set`/`add`/`has`/`delete`/`clear`/`size`/`forEach`，并且 `keys`/`values`/`entries` 返回**数组**（而不是迭代器）。
- URL 辅助工具——`URL` 解析和修改、关联的 `URLSearchParams`、`URL.canParse`/`URL.parse`、URI 和 URI 组件编解码，以及查询参数构造、查找、修改、排序、回调和具体化。URLSearchParams 迭代方法返回数组，与 Map/Set 约定一致。
- 一等 Promise——未等待的 `tools.ns.tool(...)` 是 Promise 值，其调用会立即在受监管 fiber 上启动；`await` 解析它（等待非 Promise 值不执行操作，`return tools.ns.tool(...)` 则像异步函数返回一样解析）。`Promise.all`、`Promise.allSettled` 和 `Promise.race` 接受混合 Promise 与普通值的任意数组（可内联构建、提前构建或通过展开构建）；`Promise.resolve`/`Promise.reject` 构造已结算 Promise。`Promise.allSettled` 的拒绝原因与 `catch` 绑定看到的普通 `{ name?, message }` 数据相同，`Promise.race` 会中断落败的进行中调用。最多并发运行 8 个工具调用。程序完成时，仍在运行的未等待调用会在执行结束前被等待；从未等待的调用失败时，会作为未处理拒绝诊断显示。
- 使用 `throw value` 和 `throw new Error(message)` 明确让程序失败。`Error`（以及 `TypeError`/`RangeError`/`SyntaxError`/`ReferenceError`/`EvalError`/`URIError`）是真实构造器，使用或不使用 `new` 均可调用；错误值是普通 `{ name, message }` 数据，同时满足 `instanceof Error`（与 JS 一样，特定类型既匹配自身也匹配 `Error`）。每个捕获的失败——抛出的错误、解释器运行时错误和工具失败——在 `catch` 块中都满足 `instanceof Error`；抛出的非错误值（`throw "text"`）则不满足，与 JS 一致。捕获的失败带有真实 JS 等价失败所具有的 `name`——`JSON.parse` 和无效正则模式产生 `SyntaxError`（满足 `instanceof SyntaxError`），未知标识符产生 `ReferenceError`，向常量赋值产生 `TypeError`，错误的 `normalize` 形式产生 `RangeError`；没有特定对应项的失败（包括工具失败）名为 `"Error"`。`instanceof` 还识别 `Date`、`RegExp`、`Map`、`Set`、`URL`、`URLSearchParams`、`Array`、`Object` 和 `Promise`；任何其他右侧值都会产生可捕获错误。

在程序内部，标准库值始终保持活性：内部数据检查点（`Object.*` 辅助工具、展开、强制转换输入）会保留实例，因此 `Object.values({ d: date })[0].getTime()` 和包含 Map 的对象的展开副本仍可工作。只有在宿主边界（最终结果、工具参数、`JSON.stringify`）上，它们才会完全按照 `JSON.stringify` 的方式序列化：Date 和 URL 变成字符串（无效 Date 变成 `null`），RegExp、Map、Set 和 URLSearchParams 变成 `{}`。Promise 值永远不能跨越数据边界：结果或工具参数中未等待的 Promise 会产生诊断，要求等待该 Promise，而不是将其序列化为 `{}`。

它不公开 `eval`、动态导入、模块、类、生成器、计时器、宿主全局变量、原型修改、自定义 Promise 构造器（`new Promise`）、Promise 链（`.then`/`.catch`/`.finally`——支持的风格是配合 `try`/`catch` 使用 `await`）或任意方法调用。不受支持的语法会在可用时返回带源代码位置的 `UnsupportedSyntax` 诊断。

CodeMode 是编排语言，而不是通用 JavaScript 运行时。

## 执行限制

限制恰好有三个调节项：

| 限制             |              默认值 | 边界                                               |
| ---------------- | ------------------: | -------------------------------------------------- |
| `timeoutMs`      |        无——不超时   | 墙钟执行时间。                                     |
| `maxToolCalls`   |        无——无限制   | 执行期间接纳的工具调用。                           |
| `maxOutputBytes` |        无——不截断   | 面向模型的输出：序列化结果值加上捕获的日志。       |

所有限制都刻意没有默认值：执行预算属于宿主策略，而不是库策略——需要边界的宿主自行设置；可以中断执行 fiber 的宿主（miaopan-code 会在用户取消时这样做）可以不设置超时；拥有自身工具输出截断机制的宿主（miaopan-code 具备该机制）可以不设置 `maxOutputBytes`。二者都没有的宿主应设置 `maxOutputBytes`，否则超大结果会悄无声息地淹没模型上下文。

只传入需要的覆盖值：

```ts
const runtime = CodeMode.make({
  tools,
  limits: {
    maxToolCalls: 20,
    timeoutMs: 60_000,
  },
})
```

限制必须是安全整数。`timeoutMs` 至少为 `1`；其他限制可以为 `0`。无效配置会在调用 `CodeMode.make` 或 `CodeMode.execute` 时抛出 `RangeError`。显式设置为 `undefined` 等同于省略该限制。

超过配置的 `maxOutputBytes` 永远不会使执行失败。超大结果值会被替换为截断后的序列化文本和解释性标记；日志会从开头保留，直到剩余预算耗尽（最后附上一行标记，说明发生了截断）；结果带有 `truncated: true`。

配置超时后，它会中断进行中的工具 Effect，包括程序尚未等待但已积极启动的调用（它们的 fiber 由执行过程监管）。解释器会在步骤之间协作式让出，因此超时也会中断纯忙循环（`while (true) {}`）——不存在单独的工作预算。工具实现仍有责任确保其外部操作可被中断或具有独立边界。

有两个解释器内部设置是固定常量，而不是调节项：最多同时运行 8 个工具调用，跨越数据边界的值最多嵌套 32 层（更深的值以 `InvalidDataValue` 失败，比原生堆栈溢出错误更易理解）。二者都不属于公共契约。

## 诊断

失败以数据表示：

| 种类                    | 含义                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `ParseError`            | 源代码为空或无法解析。                                                               |
| `UnsupportedSyntax`     | 已解析的 JavaScript 超出支持的子集。                                                  |
| `UnknownTool`           | 程序引用了宿主未提供的工具。                                                         |
| `InvalidToolInput`      | 工具输入未通过 Schema 解码或安全数据复制。                                           |
| `InvalidToolOutput`     | 工具输出未通过 Schema 解码或安全数据复制。                                           |
| `InvalidDataValue`      | 程序数据违反普通数据契约（深度、循环引用、被阻止的属性、非数据值）。                 |
| `ToolCallLimitExceeded` | 调用超过 `maxToolCalls`。                                                            |
| `TimeoutExceeded`       | 执行超过 `timeoutMs`。                                                               |
| `ToolFailure`           | 工具拒绝执行或执行失败。                                                             |
| `ExecutionFailure`      | 程序抛出异常或发生其他执行错误。                                                     |

未知宿主失败、缺陷、无效输出和复制失败会被净化。若要返回安全的操作拒绝，请以 `toolError` 失败：

```ts
import { toolError } from "@miaopan-code/codemode"

run: ({ id }) => (authorized(id) ? loadOrder(id) : Effect.fail(toolError("Order is unavailable")))
```

只有提供的消息对模型可见。可选 cause 永远不会在 `CodeMode.Result` 中返回；宿主应在跨越该边界前完成任何必要的内部日志记录。

## 权限边界

CodeMode 将程序限制在提供的工具树中，但不决定这些工具可以做什么。

宿主负责：

- 身份认证和授权。
- 工具选择和不可变作用域。
- 凭据和网络客户端。
- 持久化、幂等性、审批和持久副作用。
- 日志记录和脱敏策略。

CodeMode 负责：

- 在不使用 `eval` 的情况下解析并解释受支持子集。
- 工具调用周围的 Schema 边界。
- 普通数据复制和被阻止的原型成员。
- 资源限制、调用计数和规范化诊断。
- 面向模型的工具发现和指令。

程序无法通过文字或生成的代码获得权限。它只能行使所提供工具中已经存在的权限。不要公开一个宽泛的工具，然后寄希望于提示词限制它。

## 定律

公共契约遵循以下等价关系：

- `CodeMode.execute({ ...options, code })` 等价于 `CodeMode.make(options).execute(code)`。
- 工具输入成功解码前，不会调用工具实现。
- 工具结果只有在输出成功解码并越过普通数据边界后，才对程序可见。
- 未知宿主失败不会成为模型可见诊断；`ToolError` 是显式的安全消息通道。
- 宿主中断保持为中断，而不会变成 `CodeMode.Failure`。

## 非目标

- 通用权限提示或审批工作流。
- 持久化暂停/恢复、重放或存储适配器。
- 恰好一次的外部副作用。
- 应用授权或产品策略。
- 面向任意 JavaScript 的文件系统或进程沙箱。
- 与完整 JavaScript 语言或 npm 生态系统兼容。

需要审批或持久后果的应用，应在 CodeMode 之上对其建模，并且只公开当前已获授权的工具。

## 测试

从包目录运行：

```sh
bun test
bun run typecheck
```

直接测试套件覆盖公共投影、发现、Schema 边界、诊断净化、资源限制、工具调用观测和中断。
