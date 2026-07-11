# miaopan-code V2 Effect 插件 API

语言版本：简体中文 · [English](README.en.md)

Effect 插件 API 为插件提供两个进程内能力：`hook` 在 miaopan-code 扩展点安装行为，`reload` 重新运行某个有状态域的全部 transform hook。公共 Server Client 将单独提供，暂不属于 `PluginContext`。

## 定义插件

```ts
import { define } from "@miaopan-code/plugin/v2/effect"
import { Effect } from "effect"

export const Plugin = define({
  id: "example",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.catalog.transform((catalog) => {
      catalog.provider.update("example", (provider) => {
        provider.name = "Example"
      })
    })
  }),
})
```

插件配置通过 `ctx.options` 提供。注册项归插件作用域所有，作用域关闭时会自动移除，也可调用 `dispose` 提前移除。

## Hook 类型

Transform hook 用于修改 agent、catalog、command、integration、reference 和 skill 等状态域；runtime hook 用于拦截实时操作，例如替换 AI SDK 或模型语言实现。完整示例和生命周期说明请参阅 [英文文档](README.en.md)。
