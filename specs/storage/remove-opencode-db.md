# 移除 `packages/miaopan-code/src/storage/db.ts`

语言：简体中文 · [English](remove-opencode-db.en.md)

## 目标

移除旧版 `packages/miaopan-code/src/storage/db.ts` 模块的所有生产环境用法。

这意味着消除从 `@/storage/db` 或 `./storage/db` 的导入，包括：

- `Database.use(...)`
- `Database.transaction(...)`
- `Database.effect(...)`
- `Database.Client()`
- `Database.getPath()`
- `Database.TxOrDb` / `Database.Transaction`
- 从 `@/storage/db` 重新导出的 drizzle 辅助工具，例如 `eq`

这并不意味着要一步到位地从所有位置移除 SQLite 或 Drizzle。更小的目标是将调用位置迁移到更深层模块，或直接迁移到 Core/Effect 数据库适配器，从而删除 miaopan-code 旧版包装器。

## 当前清单

从 `packages/miaopan-code/src/storage/db.ts` 的生产环境导入集中在 22 个源文件中：

- `packages/miaopan-code/src/account/repo.ts`
- `packages/miaopan-code/src/cli/cmd/db.ts`
- `packages/miaopan-code/src/cli/cmd/import.ts`
- `packages/miaopan-code/src/cli/cmd/stats.ts`
- `packages/miaopan-code/src/control-plane/workspace.ts`
- `packages/miaopan-code/src/index.ts`
- `packages/miaopan-code/src/node.ts`
- `packages/miaopan-code/src/permission/index.ts`
- `packages/miaopan-code/src/project/project.ts`
- `packages/miaopan-code/src/server/projectors.ts`
- `packages/miaopan-code/src/server/routes/instance/httpapi/handlers/sync.ts`
- `packages/miaopan-code/src/server/shared/fence.ts`
- `packages/miaopan-code/src/session/message-v2.ts`
- `packages/miaopan-code/src/session/projectors.ts`
- `packages/miaopan-code/src/session/prompt.ts`
- `packages/miaopan-code/src/session/session.ts`
- `packages/miaopan-code/src/session/todo.ts`
- `packages/miaopan-code/src/share/share-next.ts`
- `packages/miaopan-code/src/storage/db.ts`
- `packages/miaopan-code/src/sync/index.ts`
- `packages/miaopan-code/src/worktree/index.ts`

这些文件中有 65 处直接 API/类型引用。引用分为以下几组。

## 第 1 组：数据库运行时与启动

状态：已完成。启动逻辑、公共 node 导出和数据库 CLI 工具不再导入旧版 miaopan-code 数据库包装器；`packages/miaopan-code/src/storage/db.ts` 已删除。

文件：

- `packages/miaopan-code/src/storage/db.ts`
- `packages/miaopan-code/src/index.ts`
- `packages/miaopan-code/src/node.ts`
- `packages/miaopan-code/src/cli/cmd/db.ts`

当前用法：

- `storage/db.ts` 打开单例数据库、应用 pragma、公开回调式访问、持有环境事务 context，并对提交后 Effect 排队。
- `index.ts` 在启动期间不再执行已移除的 JSON 到 SQLite 迁移。
- `node.ts` 从旧版模块公开重新导出 `Database`。
- `cli/cmd/db.ts` 使用 `Database.getPath()` 打印路径、打开只读 Bun SQLite 句柄、运行 `sqlite3` 以及执行 vacuum。

此组优先的原因：

- 这些调用位置定义了当前所有其他组使用的接缝。
- 删除 `storage/db.ts` 需要为数据库路径、客户端获取、迁移启动和关闭/finalization 提供明确替代方案。

目标结构：

- 将数据库路径和客户端启动放到 Core/Effect 数据库模块之后，而不是放在 miaopan-code 包装器之后。
- 使用 Effect 提供的数据库服务或狭窄的仅启动适配器替换 `Database.Client()`。
- 将 `node.ts` 的公共重新导出替换为不导出任何内容，或稳定的非旧版数据库能力。
- 保留 `cli/cmd/db.ts` 作为管理/原始 SQLite 工具，但让它向替代数据库路径提供方请求路径，而不是导入 `@/storage/db`。

## 第 2 组：同步事件事务边界

状态：已完成。`SyncEvent` 和 miaopan-code projector 边界已移除；session/message 事件投影现位于 Core EventV2/projector 基础设施中。

文件：

- `packages/miaopan-code/src/sync/index.ts`
- `packages/miaopan-code/src/session/projectors.ts`
- `packages/miaopan-code/src/server/projectors.ts`

当前用法：

- `SyncEvent.run` 使用 `Database.transaction(..., { behavior: "immediate" })` 安全分配事件序列号。
- `SyncEvent.process` 将 projector 执行、事件序列写入、事件日志写入和提交后发布包装在 `Database.transaction(...)` 中。
- `Database.effect(...)` 在事务提交后才对发布副作用排队。
- Projector 函数接受 `Database.TxOrDb`，以便通过根客户端或活动事务写入。

此组至关重要的原因：

- 它依赖最不明显的旧版行为：事务内嵌套的 `Database.use` 必须看到活动事务，且 `Database.effect` 不得在提交前发布。
- 它是 session、message、permission、workspace 和服务器投影写入的中心接缝。

目标结构：

- 使用替代数据库适配器中的显式 projector 事务类型替换 `Database.TxOrDb`。
- 将事务 context 和提交后行为移入 Effect 原生同步事件实现。
- 为序列分配保留 immediate 事务行为。
- 在转换每个 projector 主体之前，先转换 projector 注册，使其接受新的事务接口。

建议的第一步：

- 为同步投影执行创建一个狭窄的内部模块，然后将 `SyncEvent.project(...)` 和 projector 类型签名迁移到该模块。在所有 projector 用户完成迁移前，保持实现由新数据库适配器支持。

## 第 3 组：已经位于服务之后的领域仓库

状态：已完成。这些服务不再导入旧版 miaopan-code 数据库包装器。

文件：

- `packages/miaopan-code/src/account/repo.ts`
- `packages/miaopan-code/src/project/project.ts`
- `packages/miaopan-code/src/control-plane/workspace.ts`
- `packages/miaopan-code/src/share/share-next.ts`

当前用法：

- 这些模块已经公开 Effect 服务或 Effect 函数，但内部使用本地 `db(...)` 辅助函数或 `Effect.try` 包装 `Database.use`。
- `account/repo.ts` 通过仓库接口同时使用 `Database.use` 和 `Database.transaction`。
- `project/project.ts` 的混合用法最多：Effect 服务方法使用本地 `db(...)` 辅助函数，而旧版顶级函数仍直接调用 `Database.use`。
- `control-plane/workspace.ts` 和 `share/share-next.ts` 具有围绕 `Database.use` 的本地 Effect 包装器。

此组较易处理的原因：

- 公共接口已经比数据库调用更深一层。
- 大多数调用方不需要知道这些模块在内部使用 Drizzle、文件还是 Core 服务。

目标结构：

- 将替代数据库服务注入每个 Effect 层，并直接 yield Effect Drizzle 查询。
- 使用直接 Effect 查询替换本地回调包装器。
- 将剩余同步顶级辅助函数移到现有服务接口之后或 Core 模块中。

建议顺序：

- 从 `account/repo.ts` 开始；它拥有清晰的仓库接口和较少的调用位置。
- 然后迁移 `share/share-next.ts` 和 `control-plane/workspace.ts` 本地包装器。
- 将 `project/project.ts` 放在此组最后，因为它混合了项目解析、VCS、全局总线发出、迁移和旧版顶级辅助函数。

## 第 4 组：Session 与 Message 读取模型

状态：已完成。Session/message 读取和 projector 写入已经迁离旧版 miaopan-code 数据库包装器。

文件：

- `packages/miaopan-code/src/session/session.ts`
- `packages/miaopan-code/src/session/message-v2.ts`
- `packages/miaopan-code/src/session/prompt.ts`
- `packages/miaopan-code/src/session/todo.ts`
- `packages/miaopan-code/src/session/projectors.ts`

当前用法：

- `session/session.ts` 使用 `Database.use` 进行 session 读取、列表查询、子项查询、part 查找和全局列表辅助操作。
- `session/message-v2.ts` 使用 `Database.use` 对 message 分页、填充 part、获取单条 message 以及获取 part。
- `session/prompt.ts` 从 `@/storage/db` 导入 `eq`，并直接读取当前 prompt 相关的 session/message 行。
- `session/todo.ts` 使用 `Database.transaction` 替换 todo，并使用 `Database.use` 读取列表。
- `session/projectors.ts` 使用 `TxOrDb` 进行 session/message 用量投影辅助操作。

此组应拆分的原因：

- 读取可以独立于 projector 写入迁移。
- 模型 prompt 构造和 session API 会使用 message 填充；如果没有稳定读取模块就进行更改，会让查询详情散落到调用方中。
- Projector 写入与第 2 组的事务类型绑定。

目标结构：

- 创建或使用具有 Effect 原生 `get`、`list`、`page`、`parts` 和 prompt 组装读取方法的 session/message 读取模块。
- 将 todo 持久化移入 session todo 仓库或同步事件投影路径。
- 只在第 2 组定义替代 projector 事务类型后，才转换 `session/projectors.ts`。

建议顺序：

- 首先迁移 `session/message-v2.ts` 读取，因为该模块已经集中处理 message 分页和填充。
- 然后迁移 `session/session.ts` 读取辅助函数。
- 在 message/session 读取可用后迁移 `session/prompt.ts`；如果暂时仍有直接 SQL，则从 `drizzle-orm` 导入 drizzle 操作符。
- 将 `session/todo.ts` 写入与同步事务工作一起迁移，或将其移入仓库之后。

## 第 5 组：旧版 CLI 与一次性管理读取

状态：已完成。剩余的一次性 CLI/管理读取和写入现使用 Core 数据库服务或领域服务，而不是旧版 miaopan-code 数据库包装器。

文件：

- `packages/miaopan-code/src/cli/cmd/import.ts`
- `packages/miaopan-code/src/cli/cmd/stats.ts`
- `packages/miaopan-code/src/server/shared/fence.ts`
- `packages/miaopan-code/src/server/routes/instance/httpapi/handlers/sync.ts`
- `packages/miaopan-code/src/worktree/index.ts`
- `packages/miaopan-code/src/permission/index.ts`

当前用法：

- `cli/cmd/import.ts` 使用 `Database.use` 直接写入导入的 session/message/part。
- `cli/cmd/stats.ts` 直接读取所有 session。
- `server/shared/fence.ts` 查询 session 以获取 fence context。
- `handlers/sync.ts` 为 HTTP 同步端点读取事件行。
- `worktree/index.ts` 为 worktree 行为查找 project 行。
- `permission/index.ts` 直接读取 permission 行。

此组主要是清理工作的原因：

- 大多数用法都很小，可以调用现有领域服务，或获得一个狭窄的查询函数。
- 它们不定义共享事务语义。

目标结构：

- 尽可能使用现有服务替换直接数据库读取。
- 对管理/导入命令，优先使用专用 import/stat 模块，而不是从命令处理程序直接访问数据库。
- 对 HTTP 同步读取，将事件日志查询移到同步事件模块之后。
- 对 permission 和 worktree 读取，如果可用则调用 permission/project 服务；否则添加狭窄仓库方法。

## 推荐迁移顺序

所有迁移组都已完成或被取代。`packages/miaopan-code/src/storage/db.ts` 已删除。

## 已取代：数据迁移

状态：已取代。不再存在 miaopan-code 数据迁移组。

先前的 miaopan-code `data-migration.ts` 服务只从 message 行回填 session 用量。该工作现由 Core 数据库迁移 `packages/core/src/database/migration/20260510033149_session_usage.ts` 覆盖，因此不存在单独的 miaopan-code 数据迁移组。

## 必须保留的不变量

- 事务内的嵌套读取必须使用活动事务，而不是根客户端。
- `SyncEvent.run` 序列分配必须保留 immediate 事务行为。
- 提交后发布 Effect 不得在事务提交前运行。
- 现有 Schema 所有权保留在 `packages/core/src/**/*.sql.ts`；不要将表定义移回 `packages/miaopan-code`。

## 验证命令

- `rg "@/storage/db|./storage/db|Database\.(use|transaction|effect|Client|getPath)|\bTxOrDb\b|\bTransaction\b" packages/miaopan-code/src`
- 从 `packages/miaopan-code` 运行 `bun typecheck`
- 从 `packages/miaopan-code` 运行相关包测试，而不是从仓库根目录运行
