# Session Sync 事件

语言版本：简体中文 · [English](README.en.md)

SyncEvent 是用于会话可重放和多设备同步的事件溯源抽象，并与现有 `Bus` 保持兼容。系统采用单写入者模型，以递增序列号提供全序；其他设备通过读取事件日志并在本地重放来同步。

## 基本用法

```ts
SyncEvent.run(Updated, { sessionID: id, info: { title: "foo" } })
SyncEvent.subscribeAll((event) => {
  event.id
  event.seq
  event.data
})
```

Sync 事件在状态变更前发送，由 projector 执行实际变更；Bus 事件继续用于现有通知。定义 SyncEvent 时需提供 `type`、`version`、聚合字段和 Schema。完整 API、兼容性约束及迁移背景请参阅 [英文文档](README.en.md)。
