# V2 Core 指令

语言：简体中文 · [English](instructions.en.md)

这些说明描述在 v2 移植期间应如何处理 `packages/core`。

## 方向

将行为从大型应用服务移入插件。Core 服务应成为小型的类型化容器，负责状态、公开简单操作，并在策略或集成专用逻辑所属的位置触发钩子。

目标结构如下：

- `packages/core` 包含领域 Schema、类型化错误、状态容器、事件和插件钩子契约。
- 插件实现提供商专用、配置专用、认证专用、模型发现和生成行为。
- 服务从设计上支持热重载：更新粒度细、可观测，并且无需拆除整个进程。
- `packages/miaopan-code` 随时间推移变得更薄：UI、服务器路由、CLI、存储胶水和旧版兼容层应调用 Core 服务，而不是直接拥有领域逻辑。

## 服务结构

Core 服务应类似 `Catalog`、`AccountV2` 和 `AgentV2`：

- 在模块顶部定义 Schema 和品牌化 ID
- 为预期失败定义类型化 `Schema.TaggedErrorClass` 错误
- 定义包含小型操作的 `Interface`
- 公开 `Context.Service`
- 使用私有内存状态实现 `layer`
- 公开带显式依赖的 `defaultLayer`
- 通过 `export * as Name from "./file"` 自导出

优先使用简单容器 API：

- `get`、`all`、`available`、`default`、`update`、`remove`、`activate` 或其他小型领域动词
- 使用 `update(id, draft => ...)` 完成注册和变更
- 当插件需要丰富、取消或验证改动时，在提交变更前调用钩子
- 当其他服务或前端需要响应时，在提交变更后发出事件

除非某项应用策略属于领域不变量，否则不要将其直接放入 Core 服务。例如，解析模型端点继承由 catalog 负责；决定注册哪些提供商则由插件负责。

## 插件钩子

插件是 v2 的扩展边界。当逻辑应由集成提供，而不是由容器本身提供时，请向 `PluginV2.HookSpec` 添加钩子。

钩子约定：

- 钩子接收不可变输入和可变输出
- 可变对象输出以 Immer draft 形式公开
- 当插件可以阻止变更时，包含 `cancel: boolean`
- 按顺序触发钩子，确保顺序具有确定性
- 钩子名称以领域为导向，例如 `provider.update`、`model.update`、`account.activate`、`agent.generate`
- 钩子载荷应保持小巧，并使用 Core Schema 进行类型化

在以下场景使用钩子：

- 注册提供商和模型
- 应用由环境变量、账户或配置派生的启用状态
- 转换 SDK/提供商选项
- 实现代理生成等生成行为
- 当选择属于策略而不是状态时决定默认值

不要把钩子当作传输问题、UI 行为或兼容性垫片的倾倒场所。

## 插件启动

内置 Core 插件由 `packages/core/src/plugin/boot.ts` 注册。

当新的 Core 服务需要供插件使用时：

- 将服务添加到启动层依赖类型
- 在层内 yield 该服务
- 在 `add` 中将其提供给每个插件 Effect
- 只有在不会产生循环依赖时，才将其默认层添加到 `PluginBoot.defaultLayer`

启动层只负责组合。它不应包含提供商、账户、代理或模型策略本身。

## 边界

Core 不应从 `packages/miaopan-code` 导入。如果 Core 需要某个类型或概念，请先在 Core 中移动或重新建模相应领域结构。

避免原封不动地迁入旧版服务。移植领域结构和容器 API，然后将具体行为留给插件钩子实现。

移植 miaopan-code 服务时：

- 识别它拥有的状态
- 识别调用方实际需要的操作
- 识别哪些分支属于策略或集成行为
- 在 `packages/core` 中对状态和操作建模
- 为策略/集成分支添加钩子
- 在调用方能够增量迁移之前，保持旧包代码正常工作

## Schema 与类型

使用 Effect Schema 作为公共契约：

- ID 使用品牌化 Schema
- 领域数据使用 `Schema.Class` 或 `Schema.Struct`
- 预期错误使用 `Schema.TaggedErrorClass`
- 适当时使用 `DeepMutable`、`statics` 和整数 Schema 等现有 Core 辅助工具

优先使用 `Info` 对象作为存储的领域记录。当更新 API 需要在首次变更时创建记录，请添加静态 `empty(...)` 构造器。

保持 Schema 稳定且明确。除非 miaopan-code 配置结构本身就是领域模型，否则不要将其用作 Core 领域结构。

## 状态与事件

将状态保留在服务层内部。当持久化或并发需要时，使用不可变替换或 Effect ref。

为已提交的领域变更发布事件，而不是为尝试的变更发布事件。事件名称应描述领域事实，例如 `catalog.model.updated`。

v2 的目标是细粒度重新配置。模型更新应让依赖方响应该模型更新，而不应要求全局重载。

## 风格

遵循本地 Core 风格：

- 使用 `Effect.gen(function* () { ... })` 进行组合
- 公共服务方法使用 `Effect.fn("Domain.method")`
- 小型内部变更辅助函数使用 `Effect.fnUntraced`
- 类型化失败使用 `yield* new ErrorClass(...)`
- 除非辅助函数命名了真实概念，否则保持辅助函数最少
- 除非现有插件边界需要，否则不使用 `any`
- 没有具体持久化或外部消费者需求时，不添加兼容代码

优先完成最小且正确的移植。目标是让服务更易替换和推理，而不是在新包中重建旧架构。
