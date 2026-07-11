# Effect Drizzle SQLite 包

语言：简体中文 · [English](effect-sqlite-package.en.md)

## 目标

创建一个小型工作区包，将 Drizzle `effect-sqlite` 适配器的结构内置到本仓库。这不是 miaopan-code 的存储抽象，而是一个本地包，用于移植 Drizzle Effect SQLite 实现，使我们可以在上游发布前或不依赖上游发布时间使用它。

`packages/miaopan-code` 会在内部使用它，但该包本身应保持通用：Drizzle + Effect + SQLite。此包中不应包含 miaopan-code 路径、迁移、表、事务钩子、提交后行为或领域语言。

## 包结构

添加一个专注的工作区包，与其他基础设施包一样保持小巧、明确的接口：

- `packages/effect-drizzle-sqlite/package.json`
- `packages/effect-drizzle-sqlite/src/index.ts`
- `packages/effect-drizzle-sqlite/src/effect-sqlite/*`
- `packages/effect-drizzle-sqlite/src/sqlite-core/effect/*`
- `packages/effect-drizzle-sqlite/test/sqlite.test.ts`

包名：

- `@miaopan-code/effect-drizzle-sqlite`

初始导出：

```ts
export { EffectLogger } from "drizzle-orm/effect-core"
export * from "./effect-sqlite/driver"
export * from "./effect-sqlite/session"
export { migrate } from "./effect-sqlite/migrator"
export * as EffectDrizzleSqlite from "."
```

该包应尽可能严格遵循 Drizzle 的适配器命名和语义。应将其视为内置的 `drizzle-orm/effect-sqlite` 包接口，而不是新的存储服务 API。

## 上游参考资料

请使用以下内容作为实现参考，而不是自行设计自定义 API：

- Drizzle Effect Postgres 当前 RC：
  - `/Users/kit/code/open-source/drizzle-orm-rc4-pr/drizzle-orm/src/effect-core/query-effect.ts`
  - `/Users/kit/code/open-source/drizzle-orm-rc4-pr/integration-tests/tests/pg/effect-sql.test.ts`
- SQLite Effect 分支/参考：
  - `/Users/kit/code/open-source/drizzle-orm-beta16/drizzle-orm/src/up-migrations/effect-sqlite.ts`
  - `/Users/kit/code/open-source/drizzle-orm-beta16/integration-tests/tests/sqlite/effect-sql.test.ts`
  - `/Users/kit/code/open-source/drizzle-orm-beta16/drizzle-orm/type-tests/sqlite/effect.ts`
- Effect SQLite 客户端的事实来源：
  - `/Users/kit/code/open-source/effect-smol/packages/sql/sqlite-bun/src/SqliteClient.ts`
  - `/Users/kit/code/open-source/effect-smol/packages/sql/sqlite-node/test/Client.test.ts`
  - `/Users/kit/code/open-source/effect-smol/packages/sql/sqlite-node/test/SqliteMigrator.test.ts`

这些参考资料中的重要 API 模式：

- Drizzle 查询可以通过 Effect yield：`yield* db.select().from(table)`。
- 事务是 Effect 值：`yield* db.transaction((tx) => Effect.gen(...), { behavior: "immediate" })`。
- SQLite 客户端来自 `SqliteClient.layer({ filename })` 等 Effect 层。
- 迁移可以通过 Effect SQL/SQLite 迁移器机制运行，或者在可用时通过 Drizzle 的 `effect-sqlite/migrator` 运行。

## 公共接口

除非 Drizzle 移植本身已有 `Interface<TDatabase>` 抽象，否则不要自行设计一个。公共接口应与 Drizzle 的 Effect 适配器保持一致：

```ts
const db = yield * EffectDrizzleSqlite.make({ relations }).pipe(Effect.provide(EffectDrizzleSqlite.DefaultServices))

yield * db.select().from(users)
yield *
  db.transaction(
    (tx) =>
      Effect.gen(function* () {
        yield* tx.insert(users).values({ name: "Ada" })
      }),
    { behavior: "immediate" },
  )
```

注意：

- `make` / `makeWithDefaults` 应尽可能与 Drizzle Effect SQLite 分支一致。
- `DefaultServices` 应像 Effect Postgres 一样提供 Drizzle 的默认 logger/cache 服务。
- 该包应以与 Drizzle 分支相同的方式依赖 Effect SQL SQLite 客户端（`@effect/sql-sqlite-bun` 和/或 node）。
- 应用专用的路径/通道选择保留在 `packages/miaopan-code` 中。

## 应用采用说明

以下内容不是该包的要求，但对后续 miaopan-code 采用 PR 很重要。

当前 `packages/miaopan-code/src/storage/db.ts` 有两项不明显的语义，miaopan-code 包装器使用此适配器时必须保留：

- `Database.transaction` 内嵌套的 `Database.use` 看到当前事务，而不是根客户端。
- `Database.effect` 在事务内对提交后副作用排队，在事务外则立即运行。

miaopan-code 包装器可以使用 Effect context 而不是 `LocalContext` 实现：

- 保存 `{ tx, afterCommit }` 的私有事务 context。
- `withDb`/`db` 方法在存在当前事务 context 时读取它，否则使用根 db。
- `transaction` 在 Effect 周围安装事务 context。
- 嵌套事务最初可以复用现有 tx，以匹配当前行为；或者以后在需要时使用显式 savepoint。

将 miaopan-code 迁移到 Effect SQLite 时，不要移除这种行为。`SyncEvent.run` 依赖事务可组合性和 `behavior: "immediate"` 来保证顺序正确。

## 迁移策略

1. 添加 `@miaopan-code/effect-drizzle-sqlite`，并使用最小的内存/文件 SQLite 测试 Schema。
2. 将 SQLite 分支中的 Drizzle Effect SQLite 适配器移植到该包，保留上游名称和 API 结构。
3. 测试适配器级保证：
   - 查询构建器是可以 yield 的 Effect 值；
   - `transaction(..., { behavior: "immediate" })` 会提交成功的写入；
   - 失败的事务会回滚；
   - 迁移只运行一次并按顺序运行；
   - close finalizer 会关闭底层 SQLite 数据库。
4. 将 `@miaopan-code/effect-drizzle-sqlite` 添加为 `packages/miaopan-code` 的依赖。
5. 将 `packages/miaopan-code/src/storage/db.ts` 移植为薄兼容包装器，包装适配器以及 miaopan-code 专用事务/提交后 context。
6. 首先保持现有调用位置正常工作：
   - `Database.Client()`
   - `Database.use(...)`
   - `Database.transaction(...)`
   - `Database.effect(...)`
7. 兼容性稳定后，将调用位置从回调式 `Database.use` 迁移为直接 yield Effect Drizzle 查询。
8. 只有完成上述工作后，才在 miaopan-code 存储包装器之上构建 session/message/project store 等领域 store。

## 为什么这比从 SessionStorage 开始更清晰

`SessionStorage` 是有用的领域接缝，但它没有解决核心适配器问题：如何让本仓库中的 Drizzle SQLite 成为 Effect 原生实现。

Effect Drizzle SQLite 包让我们只需内置一次适配器。随后，miaopan-code 可以在其上构建自己的存储包装器，而 `SessionStorage`、`MessageStorage`、event store 和 projector 写入都可以共享同一事务和迁移模型。

## 待解决问题

- 第一个包应面向哪个客户端：`@effect/sql-sqlite-bun`、`@effect/sql-sqlite-node`，还是通过不同层同时支持二者？
- 应从 Drizzle 分支复制多少源代码，又应从 catalog `drizzle-orm` 内部导入多少？
- Drizzle 上游发布 `effect-sqlite` 后，更新路径是什么？
- 在事件发布迁移之前，`afterCommit` 是否应保持 miaopan-code 专用？默认答案：是。
- 兼容包装器应暂时保留同步返回类型，还是应有意强制调用位置使用 Effect？
- CLI/admin 原始 SQL 和 sqlite shell 应保留在 `packages/miaopan-code`，还是由存储包公开相应后端能力？

## 推荐的第一个 PR

让第一个 PR 只涉及该包，并刻意保持简单：

- 添加 `packages/effect-drizzle-sqlite`。
- 使用小型测试 Schema，而不是 miaopan-code 领域表。
- 证明 Effect Drizzle SQLite 查询、事务和迁移正常工作。
- 暂不迁移 `packages/miaopan-code`，除非类型检查需要添加依赖。

这样，我们就有一个专注的位置来验证 Effect SQLite 方案，而无需干扰 miaopan-code 当前的数据库运行时。
