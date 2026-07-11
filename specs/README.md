# 项目规范 / Specifications

语言版本：简体中文说明 · [English](../README.en.md)

本目录中的设计规范目前以英文原文为准。中文读者可先阅读下表的中文摘要；协议字段、类型名和代码标识保持原样，不应翻译。

## 规范索引

| 主题            | 文档                                                                                                                                                                                                     | 中文摘要                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 项目结构        | [中文](project.md) · [English](project.en.md)                                                                                                                                                              | 项目边界、运行时组件与目录约定   |
| 存储            | [Effect SQLite 中文](storage/effect-sqlite-package.md) · [English](storage/effect-sqlite-package.en.md)；[旧数据库迁移中文](storage/remove-opencode-db.md) · [English](storage/remove-opencode-db.en.md) | SQLite Effect 封装及旧数据库迁移 |
| V2 API          | [中文](v2/api.md) · [English API map](v2/api.html)                                                                                                                                                       | V2 API 草案与端点说明            |
| V2 配置         | [中文](v2/config.md) · [English](v2/config.en.md)                                                                                                                                                        | 配置加载、作用域和默认值         |
| V2 插件生命周期 | [中文](v2/catalog-config-plugin-lifecycle.md) · [English](v2/catalog-config-plugin-lifecycle.en.md)                                                                                                      | 插件注册、重载和生命周期         |
| V2 指令         | [中文](v2/instructions.md) · [English](v2/instructions.en.md)                                                                                                                                            | 指令发现与执行约定               |
| Provider/Model  | [模型中文](v2/provider-model.md) · [English](v2/provider-model.en.md)；[策略中文](v2/provider-policy.md) · [English](v2/provider-policy.en.md)                                                           | 模型解析、Provider 策略与能力    |
| Schema 变更     | [中文](v2/schema-changelog.md) · [English](v2/schema-changelog.en.md)                                                                                                                                    | Schema 版本与迁移记录            |
| Session         | [中文](v2/session.md) · [English](v2/session.en.md)                                                                                                                                                      | 会话持久化、执行与恢复模型       |
| Tools           | [中文](v2/tools.md) · [English](v2/tools.en.md)                                                                                                                                                          | 工具注册、调用和结果协议         |
| Todo            | [中文](v2/todo.md) · [English](v2/todo.en.md)                                                                                                                                                            | V2 待办事项与后续工作            |

如需提交规范的英文翻译，请在对应目录新增同名 `.en.md` 文件，并在中文原文顶部添加互相链接；翻译不得修改协议语义。
