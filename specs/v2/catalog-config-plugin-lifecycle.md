# Catalog、Config 与 Plugin 生命周期

语言版本：简体中文 · [English](catalog-config-plugin-lifecycle.en.md)

V2 当前采用 Location 范围的可重放 Catalog transform。配置、models.dev、认证、插件启停、配置编辑和策略变化都可能改变可见 Catalog；状态重建应保持注册顺序，并避免重载整个 Location。

外部插件延迟激活、watch/reload 以及 Provider/Model 输入归属仍在设计中。本文中文版本只做导航，不翻译协议标识；历史方案比较和决策依据请参阅 [英文规范](catalog-config-plugin-lifecycle.en.md)。
