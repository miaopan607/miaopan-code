# @miaopan-code/llm

语言：简体中文 · [English](README.en.md)

miaopan-code 的 Schema 优先 LLM 核心。请求、响应、事件和工具语言均采用统一的类型化表示；提供商差异由适配器处理，而不是散落在调用代码中。

```ts
import { Effect } from "effect"
import { LLM, LLMClient } from "@miaopan-code/llm"
import { OpenAI } from "@miaopan-code/llm/providers"

const model = OpenAI.configure({ apiKey: process.env.OPENAI_API_KEY }).responses("gpt-4o-mini")

const request = LLM.request({
  model,
  system: "You are concise.",
  prompt: "Say hello in one short sentence.",
  generation: { maxTokens: 40 },
})

const program = Effect.gen(function* () {
  const response = yield* LLMClient.generate(request)
  console.log(response.text)
})
```

需要增量 `LLMEvent` 时，请运行 `LLMClient.stream(request)`，而不是 `generate`。事件流与提供商无关——OpenAI Chat、OpenAI Responses、Anthropic Messages、Gemini、Bedrock Converse 以及任何 OpenAI 兼容部署都使用相同结构。

库中用户和模型可见的消息默认使用简体中文。在 `LLM.request(...)` 上设置 `language: "en"`，即可让验证错误、传输诊断、流回退消息和生成的工具消息保持英文。独立工具分派也接受相同值，作为 `ToolRuntime.dispatch(tools, call, language)` 的第三个参数。

## 公共 API

- **`LLM.request({...})`** —— 构建与提供商无关的 `LLMRequest`。接受便于使用的输入（`system: string`、`prompt: string`），并将其规范化为标准 Schema 类。
- **`LLM.generate` / `LLM.stream`** —— 从 `LLMClient` 重新导出，便于只用一次导入。
- **`Message.user(...)` / `Message.assistant(...)` / `Message.tool(...)`** —— 标准 Schema 模型中的消息构造器。
- **`Model.make(...)` / `ToolCallPart.make(...)` / `ToolResultPart.make(...)` / `ToolDefinition.make(...)`** —— 标准 Schema 模型中的模型及工具相关构造器。
- **`LLMClient.prepare(request)`** —— 依次完成协议请求体构造、验证和 HTTP 准备，编译请求但不发送，适用于检查和测试。
- **`LLMEvent.is.*`** —— 用于过滤流的类型化守卫（`is.textDelta`、`is.toolCall`、`is.finish` 等）。

## 缓存

提示词缓存**默认启用**。除非调用方通过 `cache: "none"` 选择退出，否则每个 `LLMRequest` 都会解析为 `cache: "auto"`。每种协议会将 `CacheHint` 转换为自身的线路格式（Anthropic 使用 `cache_control`，Bedrock 使用 `cachePoint`；OpenAI 和 Gemini 在服务端隐式缓存，不需要内联标记——因此 auto 在这些协议上不执行操作）。

### 自动放置

`"auto"` 会放置三个断点——最后一个工具定义、最后一个系统部分和最新的用户消息。最新用户消息边界是关键细节：在工具使用循环中，一次用户轮次会扩展为多个助手/工具往返，并且这些往返共享同一前缀。在该边界缓存，可以让轮次内的每次 API 调用都命中缓存。

计算结果支持将其作为默认值：Anthropic 的 5 分钟缓存写入费用是基础费用的 1.25 倍，读取费用是 0.1 倍，因此在 5 分钟内复用一次就已经更划算。低于各模型最低可缓存 token 阈值的单次补全会在线路层静默地不执行缓存，因此最坏情况也无害。

### 选择退出

```ts
LLM.request({
  model,
  system,
  prompt: "one-off question",
  cache: "none",
})
```

### 细粒度策略

```ts
cache: {
  tools?: boolean,
  system?: boolean,
  messages?: "latest-user-message" | "latest-assistant" | { tail: number },
  ttlSeconds?: number,         // ≥ 3600 → Anthropic/Bedrock 上为 1 小时；否则为 5 分钟
}
```

### 手动提示

任何文本、系统、工具或工具结果部分上的内联 `CacheHint` 都会覆盖自动放置。自动策略会保留手动提示，只填补空缺。

```ts
LLM.request({
  model,
  system: [
    { type: "text", text: "stable system prompt", cache: { type: "ephemeral" } },
  ],
  ...
})
```

### 提供商行为表

| 协议                    | `cache: "auto"`                                               |
| ----------------------- | ------------------------------------------------------------- |
| Anthropic Messages      | 最多发出 3 个 `cache_control` 标记（强制执行 4 个断点的上限） |
| Bedrock Converse        | 最多发出 3 个 `cachePoint` 块（强制执行 4 个断点的上限）      |
| OpenAI Chat / Responses | 不执行操作（对 1024 token 以上内容进行隐式缓存）              |
| Gemini                  | 不执行操作（2.5+ 隐式缓存；显式 `CachedContent` 位于带外）    |

所有提供商的规范化缓存用量都会读入 `response.usage.cacheReadInputTokens` 和 `cacheWriteInputTokens`。

## 提供商

提供商门面先配置端点、认证和部署详情，再公开只接受模型或部署 ID 的模型选择器。选中的模型携带运行时使用的可执行路由值。

```ts
import { OpenAI, CloudflareAIGateway } from "@miaopan-code/llm/providers"

const openai = OpenAI.configure({ apiKey: process.env.OPENAI_API_KEY }).responses("gpt-4o-mini")
const gateway = CloudflareAIGateway.configure({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  gatewayApiKey: process.env.CLOUDFLARE_API_TOKEN,
}).model("workers-ai/@cf/meta/llama-3.1-8b-instruct")
```

内置提供商包括 OpenAI、Anthropic、Google（Gemini）、Amazon Bedrock、Azure OpenAI、Cloudflare AI Gateway、Cloudflare Workers AI、GitHub Copilot、OpenRouter 和 xAI，此外还提供适用于 DeepSeek、Cerebras、Groq、Fireworks、Together 等服务的通用 OpenAI 兼容辅助工具。

## 提供商选项与 HTTP 覆盖

按稳定性从高到低提供三种逃生口：

1. **`generation`** —— 可移植的调节项（`maxTokens`、`temperature`、`topP`、`topK`、惩罚项、seed、stop）。
2. **`providerOptions: { <provider>: {...} }`** —— 在门面处类型化的提供商专用调节项（OpenAI `promptCacheKey`、Anthropic `thinking`、Gemini `thinkingConfig`、OpenRouter 路由）。
3. **`http: { body, headers, query }`** —— 合并到最终 HTTP 请求中的最终手段型可序列化覆盖项。只有在尚不存在稳定的类型化路径时才使用它。

对于每个维度，请求级值都会覆盖路由/提供商默认值。

## 路由

使用 `Route.make({ protocol, endpoint, auth, framing, ... })` 添加新模型或部署通常只需 5–15 行代码。路由负责端点、认证和帧格式，协议负责请求体构造及流解析。传输是可复用的 IO 模板，在编译时接收路由端点和认证。能力/目录元数据位于这个底层包之外；不受支持的请求结构会在协议降级转换期间失败。架构详情参见 `AGENTS.md`。

## Effect

此包构建于 Effect 之上。公共方法返回 `Effect` 或 `Stream`；请提供 `LLMClient.layer` 以执行运行时分派，并导入所用路由对应的提供商/协议模块。`example/tutorial.ts` 中的示例是一份可运行的演练教程。

## 另请参阅

- `AGENTS.md` —— 架构、路由构造和贡献者指南
- `example/tutorial.ts` —— 可运行的端到端演练教程
- `test/provider/*.test.ts` —— 以 fixture 为先的协议测试
