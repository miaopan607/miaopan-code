# miaopan-code 会话运行时

miaopan-code 会话会持久化对话历史，同时组装 agent 在当前环境中正确行动所需的运行时上下文。

## 术语

**System Context（系统上下文）**：
呈现给模型的结构化上下文事实集合，包括初始指令和按时间排列的更新。
_避免使用：System prompt（系统提示词）_

**Session History（会话历史）**：
provider turn 根据当前压缩状态和 **Context Epoch（上下文纪元）** 截止点选择出的投影对话序列。
_避免使用：Session Context（会话上下文）_

**Context Source（上下文源）**：
System Context 中一个独立观察到的、带类型的值，由稳定 key、JSON codec、不会失败的 loader、纯 baseline/update renderer，以及动态源可选的 removal renderer 表示。
_避免使用：Prompt fragment（提示词片段）_

**System Context Registry（系统上下文注册表）**：
按 Location 作用域管理有序 producer 的注册表；producer 为当前 System Context 提供贡献。

**Mid-Conversation System Message（会话中系统消息）**：
一种持久化的时间顺序指令，用于告知模型某个 Context Source 变更后新生效的状态。
_避免使用：System update、system notification、raw text diff_

**Context Epoch（上下文纪元）**：
一次初始渲染的 System Context 作为不可变 provider cache 基线持续有效的时间段；完成压缩、Session 移动或需要新基线的不兼容上下文转换会结束该纪元。

**Baseline System Context（基线系统上下文）**：
Context Epoch 开始时渲染出的完整 System Context。
_避免使用：Live system prompt（实时系统提示词）_

**Context Snapshot（上下文快照）**：
模型不可见、可覆盖的 JSON 状态，用于将每个 Context Source 与上一次接纳到 provider turn 的值进行比较。

**Unavailable Context（不可用上下文）**：
暂时无法观察某个 Context Source 值的预期情况；运行时保留此前的有效状态且不发出更新，或在首次成功加载前省略该值。

**Safe Provider-Turn Boundary（安全 provider turn 边界）**：
provider 调用前的边界点；此时已完成持久化输入提升和所需的工具结算，可以按时间顺序接纳上下文变化。

**Admitted Prompt（已接纳提示）**：
已接受到 Session inbox、但尚未进入 Session History 的持久化用户输入。

**Prompt Promotion（提示提升）**：
从 pending input 中持久化移除 Admitted Prompt，并将其用户消息追加到 Session History 的过程。

**Provider Turn（provider 回合）**：
向模型 provider 发出的一次请求，以及该请求产生的投影响应。

**Session Drain（会话排空）**：
一次进程内执行跨度，提升符合条件的输入并运行所需 Provider Turn，直到没有立即的继续工作。Session Drain 没有持久化身份或 transcript 边界。

**Model Tool Output（模型工具输出）**：
Core 执行的工具结果经过大小限制后形成的投影；它会持久化到 Session history 并重放给模型。工具可以从语义上塑造该投影，但最终大小由 Tool Registry 强制执行。

**Managed Tool Output File（托管工具输出文件）**：
在 miaopan-code 共享工具输出目录下创建的临时文件，用于保存过大而无法放入 Session history 的完整输出。

**Model Request Options（模型请求选项）**：
在 LLM 协议适配器为 provider 请求编码前，从 Catalog 和当前 Session variant 选出的 provider 语义模型设置。
_避免使用：Request body、wire options_

**Generation Controls（生成控制）**：
与 provider 无关的采样和输出控制；模型元数据进入 Catalog 时，应将它们与 provider 语义及兼容性 wire 字段分开。

**Native Continuation Metadata（原生继续元数据）**：
附着在 assistant 内容上的不透明协议形状数据；兼容模型要原生继续该内容时必须保留，例如 reasoning signature 或 provider 托管的 item identifier。

**PTY Environment（PTY 环境）**：
服务器创建 PTY 时提供的主机环境覆盖层；它根据请求 Location 和解析出的 PTY 工作目录观察环境。

**miaopan-code Client（miaopan-code 客户端）**：
从公开 `HttpApi` 生成的 Promise API，由 CLI 和 TUI 在内部使用。
_避免使用：Remote client（远程客户端）_

**Page（分页结果）**：
包含 `items` 以及不透明 `previous`、`next` 游标链接的有界有序结果，用于在同一查询中向任一方向翻页。
_避免使用：Response envelope（响应信封）_

## 关系与不变量

- System Context 是由零个或多个 Context Source 组成的不透明载体。
- Session History 包含投影的对话消息和已接纳的 Mid-Conversation System Message；活动的 Baseline System Context 保持为独立的 provider 请求状态。
- System Context Registry 使用稳定 key 的作用域贡献组装当前 System Context；贡献者移除后，其源会在下一个 Safe Provider-Turn Boundary 自然移除。
- Context Source 发生变化时，可以产生一条包含新有效状态的 Mid-Conversation System Message。
- Mid-Conversation System Message 持久化发送给模型的准确合并文本。
- Context Snapshot 与对应的持久化 Mid-Conversation System Message 原子地一起推进。
- Context Snapshot 为每个稳定的 Context Source key 保存一个 codec 编码的 JSON 值；对于可移除的动态源，还保存预渲染的移除消息。
- 在同一个安全边界接纳的多个 Context Source 变化合并为一条 Mid-Conversation System Message。
- 上下文变化只在 Safe Provider-Turn Boundary 惰性采样并接纳；源变化时不会异步推送。
- 在安全边界，新提升的用户输入或已结算的工具结果排在合并的 Mid-Conversation System Message 之前。
- Admitted Prompt 是可重放的 pending input，尚未成为模型可见的 Session History。
- Prompt Promotion 原子地消费 pending inbox 条目，并追加模型可见的用户消息。
- steer 提示在当前 Session Drain 仍需继续时，于下一个 Safe Provider-Turn Boundary 提升。提升任意新接纳的用户输入都会重置所选 agent 的 provider-turn 配额；同一边界提升多条提示时只重置一次。
- queued prompt 在当前 Session Drain 仍需继续时不会提升。runner 在 Session 即将空闲时提升一条 queued prompt，再重新判断是否继续，然后才可能提升下一条。
- Session Drain 是进程内协调，而不是持久化领域实体。持久化恢复应根据 prompt、投影历史、provider 尝试和工具状态推理，不要虚构包住它的执行身份。
- 第一个 provider turn 渲染最新的完整 Baseline System Context 并初始化 Context Snapshot，不发出重复的 Mid-Conversation System Message；初始上下文不可用时阻塞该回合，不持久化不完整基线。
- 初始 System Context 准备先于第一条持久化输入提升，因此不可用基线会让输入保持 pending 并可重试；普通协调在提升后进行。
- 压缩会以新渲染的 Baseline System Context 和 Context Snapshot 开始新的 Context Epoch；旧的 Mid-Conversation System Message 仍是持久化审计历史，但不再进入投影模型历史。
- 新注册但尚未出现在当前快照中的 Core 或插件 Context Source，会在下一个安全边界发出一次 baseline rendering。
- Context Source key 必须稳定且带命名空间；重复 key 会使组合失败。`SystemContext.combine(...)` 保留调用者顺序；System Context Registry 并行评估 producer，并按稳定的 contribution key 顺序组合，使渲染保持确定性。
- 每个 Context Source loader 返回一个连贯的带类型值。`SystemContext.make(...)` 隐藏该值类型，让不同类型的源能够统一组合。codec 负责比较和保存值；纯 renderer 只在需要时生成模型可见的 baseline、update 和 removal 文本。
- `SystemContext.initialize(...)` 只观察一次组合后的 System Context，并产生新的 Baseline System Context 及其 Context Snapshot。
- `SystemContext.reconcile(...)` 只观察一次组合后的 System Context，并准确返回一个下一步动作：unchanged、updated、replacement ready 或 replacement blocked。
- `SystemContext.replace(...)` 在完成压缩或其他需要更换基线的转换后渲染新 generation；此前接纳的上下文不可用时报告 replacement blocked。
- Unavailable Context 使用 stale-while-revalidate 语义，与成功加载后得到的 absence 不同；后者可以发出 removal 文本。
- 普通 Context Source loader 直接返回值；有意使用 stale-while-revalidate 的 loader 可以显式返回 Unavailable Context。
- 成功读取后的嵌套项目指令发现属于后续工作；实现后，发现的指令必须在下一个 Safe Provider-Turn Boundary 持久化接纳。
- Location 作用域服务会在移动后的 Session 于目标 Location 再次运行时自然重新解析有效上下文。
- 移动 Session 会清除活动的 Context Epoch，因此目标位置必须先初始化完整基线，之后提示才能提升。
- 指令发现、源身份、持久化和文件读取属于 instruction service；System Context 抽象只负责组合有副作用的 producer 并渲染已加载值。
- 第一阶段 instruction service 在每个 Safe Provider-Turn Boundary 观察全局以及项目目录向上的 `AGENTS.md` 文件，并将它们作为一个有序 aggregate Context Source。
- 内置和指令上下文 producer 通过 System Context Registry 以稳定 contribution key 注册。插件定义的上下文注册和热重载生命周期仍是后续工作，应沿用相同的作用域注册接缝。
- 所选 agent 的可用 skill guidance 是一个 Context Source，在 Context Epoch 接纳前与 Location 范围的注册表源组合。它只列出该 agent 被允许看到的名称和描述；skill 正文和位置只能通过经过权限检查的 `skill` 工具暴露。
- 所选 agent 和模型在 provider turn 开始时采样。边界之后接纳的变化应用于下一回合，不会重启当前回合。
- 所选 agent 的可用 skill guidance 仍是 Context Source。切换 agent 导致 guidance 变化时，产生 Mid-Conversation System Message，同时保留当前基线。
- 本地工具授权和 pending permission request 保留发起调用的 provider turn 的有效 agent；后续 agent 切换不能改变该调用的策略。
- Context Source 变化不会唤醒空闲 Session；下一次自然调度的 Safe Provider-Turn Boundary 会惰性加载并比较当前值。
- Mid-Conversation System Message 一旦接纳即持久化，即使后续 provider 尝试失败，重试时也原样重放。
- Mid-Conversation System Message 保留在持久化 Session-message history 中；普通面向用户的 transcript 界面可以隐藏它们。
- date Context Source 初始保持主机本地日历日期行为；之后可以用配置的用户时区替换默认值。
- Context Epoch 从一个不可变的 Baseline System Context 开始。
- Baseline System Context 持久化保存，并在同一 Context Epoch 的进程重启之间逐字复用。
- Baseline System Context 持久化保存活动 provider-cache prefix 使用的准确拼接文本。
- 完成压缩后，下一个 provider attempt 开始新的 Context Epoch，将当前完整 System Context 折叠成新基线，并从活动模型历史中移除早期 Mid-Conversation System Message。
- 模型或 provider 切换保留当前 Context Epoch 和按时间排列的对话历史；新的选择应用于下一次 provider turn。
- Native Continuation Metadata 保留在持久化历史中。只有在准确匹配原始 provider/model 且尝试成功时，provider-turn projection 才包含它；失败回合和不兼容模型会省略不透明元数据，切换模型后，非空可见 reasoning 会降级为普通 assistant 文本。只有在 provider 测试记录兼容性后，才可以放宽这一保守关系。
- Model Request Options 在 Catalog 解析过程中保持 provider 语义。Session runner 将它们映射到 LLM 包的 provider-option 命名空间；只有选定的协议适配器负责 provider wire 编码。
- Generation Controls、协议语义的 Model Request Options 和兼容性 request body 字段属于不同的 Catalog 域。共享 ingestion adapter 在路由前划分 legacy 与 models.dev 的 AI-SDK 形状选项。
- PTY Environment 是服务器职责，而不是 Core PTY 职责。PTY 创建按调用方值、主机覆盖层、Core 强制的终端不变量（如 `TERM` 和 `MIAOPAN_CODE_TERMINAL`）的顺序合并。
- 服务器具体的 `HttpApi` 是生成 SDK 的权威来源。Protocol 负责 endpoint 构建和 middleware 放置；Server 提供具体 handler 和服务。
- Promise SDK 返回带类型的值、保留声明的失败，并将传输选项与领域输入分开。
- Promise streaming 方法返回惰性的 `AsyncIterable`，传输断开时显式失败；重新订阅策略由调用方负责。
- SDK 构造同步且不访问网络。它需要 `baseUrl`，默认使用 `globalThis.fetch`，并接受客户端级 headers。
- 生成的 Promise 客户端从 `@miaopan/sdk` 发布，并由 CLI 和 TUI 内部使用。
- SDK 通过公开 HTTP 边界保留 Server 的 routing、codec、handler 和 error；它不承载进程内服务器。
- 面向 CLI 和 TUI 的能力必须属于权威公开 `HttpApi` 及其生成的 SDK。
- `sessions.events({ sessionID, after })` 是公开的持久化 Session event stream。它先验证 Session，重放可选 aggregate sequence 之后的持久化事件，继续发送新提交的持久化事件，并排除仅实时片段。
- `events.subscribe()` 是独立的、实例范围的实时 stream，包含 Session 与非 Session 活动。它不保证重放，并包含连接、心跳和实例销毁生命周期事件；消费者断开后应刷新权威状态。
- Session ID 不是 `events.subscribe()` 的可选过滤器：实例范围实时事件与持久化 Session 事件具有不同的 schema、重放保证、游标、生命周期事件和失败行为。
- 初始通用 miaopan-code Client 不暴露服务器全局事件聚合。`events.subscribe()` 限定在连接的 miaopan-code instance 或 workspace；未来跨实例管理流必须另行设计 API。
- `events.subscribe()` 不会在传输断开后自动重连。仅实时的 stream 以 `ClientError` 失败；消费者应先刷新权威状态，再显式打开新订阅，因为断开期间错过的事件无法重放。
- `sessions.events({ sessionID, after })` 返回生成 HTTP 客户端提供的冷持久化 event stream，不在 endpoint 或客户端构造函数中内置重连策略。传输断开会以 `ClientError` 失败。调用方可以保留最后观察到的持久化序列并用 `after` 打开新订阅，在其上组合显式恢复流；可复用的 resume helper 仍是独立 API 设计问题。
- 稳定的 `sessions.list(...)` 设计返回 Page，并保留现有 HTTP `{ data, cursor }` envelope。
- Session list cursor 是携带继续查询和排序状态的不透明 branded value。消费者原样传回，不检查 storage anchor 或编码后的过滤字段。
- Session list continuation 只接受不透明 cursor。scope、过滤条件、排序和 page size 由初始查询固定并由 cursor 携带。
- `sessions.messages(...)` 返回 Page，并使用与 `sessions.list(...)` 相同的 cursor 规则：初始请求提供 `sessionID`、排序和 page size；继续请求提供 `sessionID` 以及不透明 branded message cursor，cursor 携带排序、page size、方向和 message anchor。使用另一个 Session 的 cursor 必须视为无效。
- `sessions.message({ sessionID, messageID })` 是必需的资源查找。未知 Session 失败为 `SessionNotFoundError`；已知 Session 中缺失或属于其他 Session 的消息失败为 `MessageNotFoundError`，不能泄露跨 Session 的所有权。公开 HTTP 边界不能用 `undefined` 表示缺失。
- `sessions.interrupt({ sessionID })` 先验证持久化 Session；未知 Session 失败为 `SessionNotFoundError`。已知 Session 的中断是幂等的：空闲、已结算或本地未拥有执行时都是无操作。
- `sessions.active()` 将当前进程的前台 Session drain registry 快照为 Session ID 到 `{ type: "running" }` 的 record。缺失 ID 视为 inactive；后台 subagent 和 task 不会使父 Session active，进程重启会清空 registry。
- `sessions.context({ sessionID })` 保留既有的仅消息操作。它返回作为 Session context 选出的投影对话消息，不包含也不表示完整 provider request context；基线系统上下文和其他贡献保持独立。
- **待定问题**：未来是否应通过一个单独命名的操作暴露完整 provider request context，包括基线系统上下文、所选源贡献和 context-epoch 元数据？
- `sessions.prompt(...)` 暴露 `resume?: boolean`。省略它时保持持久化接纳并发出建议性的执行唤醒；`resume: false` 要求只持久化接纳。
- 公开操作仍为 `sessions.prompt(...)`；`SessionInput.admit` 是内部 primitive，公开的 `Admission` result 与 `resume` 选项表达持久化接纳语义。
- `sessions.create(...)` 接受可选的 `location`。省略时通过连接的 miaopan-code instance 默认或当前 location 解析；显式值选择已知 location。
- `sessions.switchAgent({ sessionID, agent })` 与 `sessions.switchModel(...)` 一样属于通用 client。它影响后续 Session 活动；未知 Session 失败为 `SessionNotFoundError`。
- PTY Environment adapter 在请求 Location 观察插件，同时将解析出的 PTY 工作目录传给 hook；独立服务器使用空 adapter。
- 支持时，Mid-Conversation System Message 降为 provider 的原生时间顺序 instruction role；否则降为包装后的时间顺序 fallback。
- 有效 aggregate instruction set 变化时，Mid-Conversation System Message 包含完整的当前有序集合并取代之前的 aggregate value；没有任何 ambient instruction 时，消息说明此前加载的 instruction 不再适用。
- ambient project instruction discovery 遵循 `MIAOPAN_CODE_DISABLE_PROJECT_CONFIG`；global instruction 仍可用。
- 过大的文本 Model Tool Output 在 Session history 中保留有界预览，同时将完整文本移入 managed tool-output storage。任意结构化结果的大小是另一个问题。
- 一次工具结算使用一个聚合文本限制，取配置的最大行数或 UTF-8 字节数先达到者。该限制与 provider 无关；token 压力属于上下文组装和压缩。
- 通用截断保留文本的开头和结尾。工具可以先采用更有语义的策略，然后由 Tool Registry 执行最终限制。
- 被截断的 Model Tool Output 会在有界的模型可见预览和带类型的 managed output path 中同时标识完整文本。managed output path 不改变工具已校验的结构化结果。
- Managed Tool Output File 是临时的，可能在保留期后过期。有界 Model Tool Output 而不是文件才是可持久化重放的记录。
- 无法保留 Managed Tool Output File 不会把成功的工具操作改成失败。Session 记录明确有损的有界输出（不含 path），同时为运维人员提供诊断。
- 工具操作成功后，对 Model Tool Output 限制大小并发布一次持久化结算形成可安全中断的完成区间。原始过大成功结果不会在稍后修正前先发布。
- 仅结构化的结果超过 Model Tool Output 限制时，已校验的结构化值对 Session 消费者保持不变；模型重放使用有界的文本 JSON 预览和可选 managed output path。
- 已有的工具托管输出路径会穿过通用限制保留。fallback 文件准确保留 Tool Registry 收到的完整投影文本，不声称能重建工具专用 shaping 已丢弃的输出。
- Managed Tool Output Files 在一个共享的扁平目录中使用全局唯一名称。其绝对路径可由普通工具读取和搜索；其他绝对路径仍在 Location 作用域文件系统权限之外。
- provider 执行的工具结果是通用 Tool Registry 限制之外的 provider-native transcript fact。它们的上下文控制需要 provider 感知的裁剪或压缩，因为部分 provider 要求精确的结构化往返载荷。

## Client contract 架构

内部和公开端含义相同的语义值放在轻量的 Schema 叶包中。Core 使用 Schema 实现领域行为；Protocol 将 Schema 值组合为 path、payload、envelope、error、cursor 和 stream；Server 同时导入两者，承载 Protocol 的准确分组并负责协议与领域适配。根 Promise client 保持零 Effect，CLI 直接组合生成的 SDK、Core 和 Server runtime。

共享的公开 record 使用 `Schema.Struct` 声明为普通对象。同名推导 interface 为对象 record 提供可读的 TypeScript 签名，不引入 constructor、prototype 或 nominal identity；union 保留显式 type alias。

稳定 client API 之前必须做到：

- 额外公开 schema 放在 Schema，额外网络分组放在 Protocol；两个包都不能传递加载数据库、Drizzle、Session execution、provider、watcher、native module 或 WASM。
- 具体的 Location middleware key 保留在 Server，Protocol 负责其放置位置。
- 将现有 list response envelope 投影为稳定 client Page 形状，并区分初始查询输入与 cursor continuation 输入，不改变托管的 V2 wire contract。
- 确定稳定的消费者命名空间（`session` 或当前 beta 的 `sessions`）；如果消费者名称与 server group identifier 不同，使用明确的 codegen annotation。
- 在进行改动时保留 V2 route path、operation ID、codec、error、middleware 行为和 OpenAPI 输出。
- 通过 import-boundary 测试保留浏览器安全的生成 SDK surface。

## 示例对话

> **开发者**：“Session 运行期间日期发生变化，Mid-Conversation System Message 应该说明旧日期吗？”
> **领域专家**：“不需要。发出新生效的日期，让 agent 能够依据当前 System Context 行动。”

## 待决歧义

- 旧版 `experimental.chat.system.transform` 可以任意修改组装后的基线系统提示词，但 V2 插件还没有等价的 hook。需要另行决定是迁移它、用插件定义的 Context Source 替代动态用法，还是收窄其语义。
