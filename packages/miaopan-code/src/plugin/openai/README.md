# OpenAI Responses WebSocket

语言版本：简体中文 · [English](README.en.md)

该插件为 OpenAI Responses 提供 WebSocket 传输。`local`、`dev` 和 `beta` 默认启用；`latest` 与 `prod` 需设置 `MIAOPAN_CODE_EXPERIMENTAL_WEBSOCKETS=true`。

## 流程与生命周期

流式 `POST /responses` 请求会在具备会话标识且连接可用时复用 WebSocket，否则回退 HTTP；标题请求始终使用 HTTP。连接超时 15 秒、空闲超时 5 分钟，完成响应后保留连接并最多复用 55 分钟。

## 重试

WebSocket 建连或流式设置失败最多重试 5 次，之后该会话回退 HTTP，直到池项被清理。首个事件后失败会作为可重试错误返回，不会在传输层重放部分输出；中止或取消会关闭连接。后续计划请参阅 [英文说明](README.en.md)。
