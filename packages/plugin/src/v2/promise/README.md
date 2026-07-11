# miaopan-code V2 Promise 插件 API

语言版本：简体中文 · [English](README.en.md)

Promise 插件 API 是 `@miaopan/plugin/v2/effect` 的 async/await 版本，提供相同的 `hook` 和 `reload` 能力。Hook 回调、注册、`reload` 以及 `Registration.dispose` 使用 Promise，而不是 Effect。

## 定义插件

```ts
import { define } from "@miaopan/plugin/v2/promise"

export const Plugin = define({
  id: "example",
  setup: async (ctx) => {
    await ctx.catalog.transform((catalog) => {
      catalog.provider.update("example", (provider) => {
        provider.name = "Example"
      })
    })
  },
})
```

配置通过 `ctx.options` 提供。Transform hook 可作用于 agent、catalog、command、integration、reference 和 skill 等状态域；runtime hook 用于拦截实时操作。完整示例和生命周期说明请参阅 [英文文档](README.en.md)。
