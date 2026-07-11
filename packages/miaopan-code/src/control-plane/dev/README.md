# 本地远程环境调试插件

语言版本：简体中文 · [English](README.en.md)

该插件用于在本地模拟远程环境。将以下配置加入 `.miaopan-code/miaopan-code.jsonc`：

```json
{ "plugin": ["../packages/miaopan-code/src/control-plane/dev/debug-workspace-plugin.ts"] }
```

另开终端运行 `./packages/miaopan-code/script/run-workspace-server`，再启动 miaopan-code 并创建 `debug` 类型工作区。插件会通过文件传递工作区 ID 和端口；调试服务器监视文件变化，因此同一时间只有一个 `debug` 工作区可用。完整机制请参阅 [英文说明](README.en.md)。
