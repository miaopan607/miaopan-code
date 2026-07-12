# 仓库协作与开发约定

本文档仅提供简体中文版本。

## 国际化要求

- 默认语言为简体中文（`zh-CN`）；英文是额外支持的语言，不得取代中文默认值。
- 所有面向用户、模型、工具调用结果、日志、错误、CLI/TUI 界面、OpenAPI/SDK 描述和文档中的自然语言，都必须通过 i18n key 或对应语言资源提供。不要在业务代码中新增自然语言硬编码。
- 新增文案时先定义稳定的 i18n key，再补齐中文和英文资源；语言选择由运行时 locale 决定，禁止用散落的条件分支拼接翻译。
- 提示词也属于自然语言资源：保持原有语义和结构，只通过语言资源切换语言；除非用户明确要求，不要擅自改写、扩展或润色既有提示词。
- 中文文档放在默认文件名（如 `README.md`、`AGENTS.md`）；英文文档使用额外的 `.en.md` 文件。`AGENTS.md` 和 `CONTEXT.md` 只维护中文版本。新增语言应沿用稳定的语言后缀和同一 i18n key，不要把翻译写进默认英文文件。
- 代码标识符、协议字段、命令名、文件路径和第三方专有名词按原样保留，不把技术标识符当作自然语言翻译。

- 重新生成旧版 JavaScript SDK：运行 `./packages/sdk/js/script/build.ts`。
- 修改公开 Protocol 或 Server `HttpApi` 后，必须运行 `./packages/sdk/js/script/build.ts` 重新生成旧版 SDK。不要直接编辑生成的 SDK 输出。
- 保持运行时依赖方向为 Schema → Core、Protocol，再由 Core、Protocol → Server。生成的 SDK 必须独立于 Core 和 Server；CLI 负责组合 SDK、Core 和 Server。
- 本仓库默认分支为 `main`。
- 比较差异时使用 `main` 或 `origin/main`。

## 分支命名

使用不超过三个单词、以连字符分隔的短分支名。不要使用斜杠或 `feat/`、`fix/` 等类型前缀。

示例：`session-recovery`、`fix-scroll-state`、`regenerate-sdk`。

## 提交信息和 PR 标题

提交信息和 PR 标题使用 Conventional Commit 格式：`type(scope): summary`。

有效类型为 `feat`、`fix`、`docs`、`chore`、`refactor` 和 `test`。scope 可选；如果有帮助，请使用受影响的包或领域，例如 `core`、`miaopan-code`、`tui`、`sdk` 或 `plugin`。

提交消息写中文。

## 代码风格

### 通用原则

- 除非逻辑可组合或可复用，否则将逻辑保留在一个函数中。
- 不要预先抽取只使用一次的辅助函数。除非辅助函数会复用、隐藏真正复杂的边界，或有清晰的独立概念，否则直接在调用处内联。
- 尽量避免 `try`/`catch`。
- 避免使用 `any` 类型。
- 可以使用 Bun API 时优先使用，例如 `Bun.file()`。
- 尽量依赖类型推导；除非导出或可读性确有需要，否则不要显式添加类型标注或接口。
- 优先使用函数式数组方法（`flatMap`、`filter`、`map`），而不是 `for` 循环；`filter` 使用类型守卫以保持后续类型推导。
- 在 `src/config` 中新增配置模块时，遵循文件顶部已有的自导出模式（例如 `export * as ConfigAgent from "./agent"`）。
- 在 Effect generator 中先将服务绑定到具名变量，再调用其方法。不要使用 `yield* (yield* Foo.Service).bar()` 这样的嵌套服务 yield。

只使用一次的值应通过内联减少变量总数。

```ts
// 推荐
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// 不推荐
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### 解构

避免不必要的解构，使用点号访问以保留上下文。

```ts
// 推荐
obj.a
obj.b

// 不推荐
const { a, b } = obj
```

### 导入

- 绝不要为导入起别名。不要写 `import { foo as bar } from "..."` 或 `resolve as pathResolve` 这样的重命名导入。
- 绝不要使用星号导入。不要写 `import * as Foo from "..."` 或 `import type * as Foo from "..."`。
- 如果需要命名空间式的值，应导入模块自己导出的命名空间。例如 `import { Project } from "@miaopan-code/core/project"`，再使用 `Project.ID`。
- 对只在特定代码路径需要的重量级模块，尤其是启动敏感入口，优先使用动态导入。在最窄的使用作用域顶部解构动态导入绑定，使其读起来像普通导入。避免 `await import("./module").then((mod) => mod.value())` 或 `(await import("./module")).value()` 这样的内联链式写法。分支专用导入应留在分支中，以保持惰性加载。

### 变量

优先使用 `const` 而不是 `let`。使用三元表达式或提前返回代替重新赋值。

```ts
// 推荐
const foo = condition ? 1 : 2

// 不推荐
let foo
if (condition) foo = 1
else foo = 2
```

### 控制流

避免使用 `else`，优先使用提前返回。

```ts
// 推荐
function foo() {
  if (condition) return 1
  return 2
}

// 不推荐
function foo() {
  if (condition) return 1
  else return 2
}
```

### 复杂逻辑

函数包含多个校验分支或辅助细节时，让主函数呈现成功路径，并把辅助细节移到下面的小函数中。

```ts
// 推荐
export function loadThing(input: unknown) {
  const config = requireConfig(input)
  const metadata = readMetadata(input)
  return createThing({ config, metadata })
}

function requireConfig(input: unknown) {
  ...
}
```

- 如果能提升可读性，将辅助函数放在其支持的主导出函数附近、函数之后。
- 不要把简单表达式过度抽象成许多只使用一次的辅助函数；只有在它命名了真实概念（如 `requireConfig` 或 `readMetadata`）时才抽取。
- 除非辅助函数确实执行效果，否则不要让它返回 `Effect`。同步解析、校验和选项构建应保持同步。
- 解析不可信 JSON 字符串时，优先使用 `Schema.UnknownFromJsonString`、`Schema.decodeUnknownOption` 等 Effect Schema 辅助函数，而不是手动 `JSON.parse` 再包裹 `Effect.try`。
- 只为不明显的约束和反直觉行为添加注释，不要为显而易见的赋值或控制流添加注释。

### Schema 定义（Drizzle）

字段使用 snake_case，这样列名不需要再次写成字符串。

```ts
// 推荐
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// 不推荐
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## 测试

- 尽量避免 mock；除非别无选择，不应使用 `globalThis.*`。
- 测试真实实现，不要在测试中复制一份实现逻辑。
- 不能从仓库根目录运行测试（有 `do-not-run-tests-from-root` 守卫）；应从包目录运行，例如 `packages/miaopan-code`。

## 格式化

- 提交前必须从仓库根目录运行 `bun x prettier --write .` 格式化全部受支持文件。
- 提交前必须运行 `bun x prettier --check .`，确保没有未格式化文件。

## 类型检查

- 始终从包目录运行 `bun typecheck`（例如 `packages/miaopan-code`），不要直接运行 `tsc`。

## V2 Session Core

项目代码里有这个部分，但是不要管他。
