// 此文件由 @hey-api/openapi-ts 自动生成

import type { Options as ClientOptions, TDataShape, Client } from "./client/index.js"
import type {
  GlobalEventData,
  GlobalEventResponses,
  ProjectListData,
  ProjectListResponses,
  ProjectCurrentData,
  ProjectCurrentResponses,
  PtyListData,
  PtyListResponses,
  PtyCreateData,
  PtyCreateResponses,
  PtyCreateErrors,
  PtyRemoveData,
  PtyRemoveResponses,
  PtyRemoveErrors,
  PtyGetData,
  PtyGetResponses,
  PtyGetErrors,
  PtyUpdateData,
  PtyUpdateResponses,
  PtyUpdateErrors,
  PtyConnectData,
  PtyConnectResponses,
  PtyConnectErrors,
  ConfigGetData,
  ConfigGetResponses,
  ConfigUpdateData,
  ConfigUpdateResponses,
  ConfigUpdateErrors,
  ToolIdsData,
  ToolIdsResponses,
  ToolIdsErrors,
  ToolListData,
  ToolListResponses,
  ToolListErrors,
  InstanceDisposeData,
  InstanceDisposeResponses,
  PathGetData,
  PathGetResponses,
  VcsGetData,
  VcsGetResponses,
  SessionListData,
  SessionListResponses,
  SessionCreateData,
  SessionCreateResponses,
  SessionCreateErrors,
  SessionStatusData,
  SessionStatusResponses,
  SessionStatusErrors,
  SessionDeleteData,
  SessionDeleteResponses,
  SessionDeleteErrors,
  SessionGetData,
  SessionGetResponses,
  SessionGetErrors,
  SessionUpdateData,
  SessionUpdateResponses,
  SessionUpdateErrors,
  SessionChildrenData,
  SessionChildrenResponses,
  SessionChildrenErrors,
  SessionTodoData,
  SessionTodoResponses,
  SessionTodoErrors,
  SessionInitData,
  SessionInitResponses,
  SessionInitErrors,
  SessionForkData,
  SessionForkResponses,
  SessionAbortData,
  SessionAbortResponses,
  SessionAbortErrors,
  SessionUnshareData,
  SessionUnshareResponses,
  SessionUnshareErrors,
  SessionShareData,
  SessionShareResponses,
  SessionShareErrors,
  SessionDiffData,
  SessionDiffResponses,
  SessionDiffErrors,
  SessionSummarizeData,
  SessionSummarizeResponses,
  SessionSummarizeErrors,
  SessionMessagesData,
  SessionMessagesResponses,
  SessionMessagesErrors,
  SessionPromptData,
  SessionPromptResponses,
  SessionPromptErrors,
  SessionMessageData,
  SessionMessageResponses,
  SessionMessageErrors,
  SessionPromptAsyncData,
  SessionPromptAsyncResponses,
  SessionPromptAsyncErrors,
  SessionCommandData,
  SessionCommandResponses,
  SessionCommandErrors,
  SessionShellData,
  SessionShellResponses,
  SessionShellErrors,
  SessionRevertData,
  SessionRevertResponses,
  SessionRevertErrors,
  SessionUnrevertData,
  SessionUnrevertResponses,
  SessionUnrevertErrors,
  PostSessionIdPermissionsPermissionIdData,
  PostSessionIdPermissionsPermissionIdResponses,
  PostSessionIdPermissionsPermissionIdErrors,
  CommandListData,
  CommandListResponses,
  ConfigProvidersData,
  ConfigProvidersResponses,
  ProviderListData,
  ProviderListResponses,
  ProviderAuthData,
  ProviderAuthResponses,
  ProviderOauthAuthorizeData,
  ProviderOauthAuthorizeResponses,
  ProviderOauthAuthorizeErrors,
  ProviderOauthCallbackData,
  ProviderOauthCallbackResponses,
  ProviderOauthCallbackErrors,
  FindTextData,
  FindTextResponses,
  FindFilesData,
  FindFilesResponses,
  FindSymbolsData,
  FindSymbolsResponses,
  FileListData,
  FileListResponses,
  FileReadData,
  FileReadResponses,
  FileStatusData,
  FileStatusResponses,
  AppLogData,
  AppLogResponses,
  AppLogErrors,
  AppAgentsData,
  AppAgentsResponses,
  McpStatusData,
  McpStatusResponses,
  McpAddData,
  McpAddResponses,
  McpAddErrors,
  McpAuthRemoveData,
  McpAuthRemoveResponses,
  McpAuthRemoveErrors,
  McpAuthStartData,
  McpAuthStartResponses,
  McpAuthStartErrors,
  McpAuthCallbackData,
  McpAuthCallbackResponses,
  McpAuthCallbackErrors,
  McpAuthAuthenticateData,
  McpAuthAuthenticateResponses,
  McpAuthAuthenticateErrors,
  McpConnectData,
  McpConnectResponses,
  McpDisconnectData,
  McpDisconnectResponses,
  LspStatusData,
  LspStatusResponses,
  FormatterStatusData,
  FormatterStatusResponses,
  TuiAppendPromptData,
  TuiAppendPromptResponses,
  TuiAppendPromptErrors,
  TuiOpenHelpData,
  TuiOpenHelpResponses,
  TuiOpenSessionsData,
  TuiOpenSessionsResponses,
  TuiOpenThemesData,
  TuiOpenThemesResponses,
  TuiOpenModelsData,
  TuiOpenModelsResponses,
  TuiSubmitPromptData,
  TuiSubmitPromptResponses,
  TuiClearPromptData,
  TuiClearPromptResponses,
  TuiExecuteCommandData,
  TuiExecuteCommandResponses,
  TuiExecuteCommandErrors,
  TuiShowToastData,
  TuiShowToastResponses,
  TuiPublishData,
  TuiPublishResponses,
  TuiPublishErrors,
  TuiControlNextData,
  TuiControlNextResponses,
  TuiControlResponseData,
  TuiControlResponseResponses,
  AuthSetData,
  AuthSetResponses,
  AuthSetErrors,
  EventSubscribeData,
  EventSubscribeResponses,
} from "./types.gen.js"
import { client as _heyApiClient } from "./client.gen.js"

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<
  TData,
  ThrowOnError
> & {
  /**
   * 可以提供由 `createClient()` 返回的客户端实例，而不是逐项提供选项。如果需要实现自定义客户端，这也会很有用。
   */
  client?: Client
  /**
   * 可以通过 `meta` 对象传递任意值，用于访问未定义为 SDK 函数一部分的值。
   */
  meta?: Record<string, unknown>
}

class _HeyApiClient {
  protected _client: Client = _heyApiClient

  constructor(args?: { client?: Client }) {
    if (args?.client) {
      this._client = args.client
    }
  }
}

class Global extends _HeyApiClient {
  /**
   * 获取事件
   */
  public event<ThrowOnError extends boolean = false>(options?: Options<GlobalEventData, ThrowOnError>) {
    return (options?.client ?? this._client).get.sse<GlobalEventResponses, unknown, ThrowOnError>({
      url: "/global/event",
      ...options,
    })
  }
}

class Project extends _HeyApiClient {
  /**
   * 列出所有项目
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<ProjectListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProjectListResponses, unknown, ThrowOnError>({
      url: "/project",
      ...options,
    })
  }

  /**
   * 获取当前项目
   */
  public current<ThrowOnError extends boolean = false>(options?: Options<ProjectCurrentData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProjectCurrentResponses, unknown, ThrowOnError>({
      url: "/project/current",
      ...options,
    })
  }
}

class Pty extends _HeyApiClient {
  /**
   * 列出所有 PTY 会话
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<PtyListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<PtyListResponses, unknown, ThrowOnError>({
      url: "/pty",
      ...options,
    })
  }

  /**
   * 创建新的 PTY 会话
   */
  public create<ThrowOnError extends boolean = false>(options?: Options<PtyCreateData, ThrowOnError>) {
    return (options?.client ?? this._client).post<PtyCreateResponses, PtyCreateErrors, ThrowOnError>({
      url: "/pty",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 移除 PTY 会话
   */
  public remove<ThrowOnError extends boolean = false>(options: Options<PtyRemoveData, ThrowOnError>) {
    return (options.client ?? this._client).delete<PtyRemoveResponses, PtyRemoveErrors, ThrowOnError>({
      url: "/pty/{id}",
      ...options,
    })
  }

  /**
   * 获取 PTY 会话信息
   */
  public get<ThrowOnError extends boolean = false>(options: Options<PtyGetData, ThrowOnError>) {
    return (options.client ?? this._client).get<PtyGetResponses, PtyGetErrors, ThrowOnError>({
      url: "/pty/{id}",
      ...options,
    })
  }

  /**
   * 更新 PTY 会话
   */
  public update<ThrowOnError extends boolean = false>(options: Options<PtyUpdateData, ThrowOnError>) {
    return (options.client ?? this._client).put<PtyUpdateResponses, PtyUpdateErrors, ThrowOnError>({
      url: "/pty/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 连接 PTY 会话
   */
  public connect<ThrowOnError extends boolean = false>(options: Options<PtyConnectData, ThrowOnError>) {
    return (options.client ?? this._client).get<PtyConnectResponses, PtyConnectErrors, ThrowOnError>({
      url: "/pty/{id}/connect",
      ...options,
    })
  }
}

class Config extends _HeyApiClient {
  /**
   * 获取配置信息
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<ConfigGetData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ConfigGetResponses, unknown, ThrowOnError>({
      url: "/config",
      ...options,
    })
  }

  /**
   * 更新配置
   */
  public update<ThrowOnError extends boolean = false>(options?: Options<ConfigUpdateData, ThrowOnError>) {
    return (options?.client ?? this._client).patch<ConfigUpdateResponses, ConfigUpdateErrors, ThrowOnError>({
      url: "/config",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 列出所有提供商
   */
  public providers<ThrowOnError extends boolean = false>(options?: Options<ConfigProvidersData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ConfigProvidersResponses, unknown, ThrowOnError>({
      url: "/config/providers",
      ...options,
    })
  }
}

class Tool extends _HeyApiClient {
  /**
   * 列出所有工具 ID（包括内置和动态注册的工具）
   */
  public ids<ThrowOnError extends boolean = false>(options?: Options<ToolIdsData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ToolIdsResponses, ToolIdsErrors, ThrowOnError>({
      url: "/experimental/tool/ids",
      ...options,
    })
  }

  /**
   * 列出指定提供商/模型的工具及其 JSON Schema 参数
   */
  public list<ThrowOnError extends boolean = false>(options: Options<ToolListData, ThrowOnError>) {
    return (options.client ?? this._client).get<ToolListResponses, ToolListErrors, ThrowOnError>({
      url: "/experimental/tool",
      ...options,
    })
  }
}

class Instance extends _HeyApiClient {
  /**
   * 释放当前实例
   */
  public dispose<ThrowOnError extends boolean = false>(options?: Options<InstanceDisposeData, ThrowOnError>) {
    return (options?.client ?? this._client).post<InstanceDisposeResponses, unknown, ThrowOnError>({
      url: "/instance/dispose",
      ...options,
    })
  }
}

class Path extends _HeyApiClient {
  /**
   * 获取当前路径
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<PathGetData, ThrowOnError>) {
    return (options?.client ?? this._client).get<PathGetResponses, unknown, ThrowOnError>({
      url: "/path",
      ...options,
    })
  }
}

class Vcs extends _HeyApiClient {
  /**
   * 获取当前实例的版本控制信息
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<VcsGetData, ThrowOnError>) {
    return (options?.client ?? this._client).get<VcsGetResponses, unknown, ThrowOnError>({
      url: "/vcs",
      ...options,
    })
  }
}

class Session extends _HeyApiClient {
  /**
   * 列出所有会话
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<SessionListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<SessionListResponses, unknown, ThrowOnError>({
      url: "/session",
      ...options,
    })
  }

  /**
   * 创建新会话
   */
  public create<ThrowOnError extends boolean = false>(options?: Options<SessionCreateData, ThrowOnError>) {
    return (options?.client ?? this._client).post<SessionCreateResponses, SessionCreateErrors, ThrowOnError>({
      url: "/session",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 获取会话状态
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<SessionStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<SessionStatusResponses, SessionStatusErrors, ThrowOnError>({
      url: "/session/status",
      ...options,
    })
  }

  /**
   * 删除会话及其全部数据
   */
  public delete<ThrowOnError extends boolean = false>(options: Options<SessionDeleteData, ThrowOnError>) {
    return (options.client ?? this._client).delete<SessionDeleteResponses, SessionDeleteErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
    })
  }

  /**
   * 获取会话
   */
  public get<ThrowOnError extends boolean = false>(options: Options<SessionGetData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionGetResponses, SessionGetErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
    })
  }

  /**
   * 更新会话属性
   */
  public update<ThrowOnError extends boolean = false>(options: Options<SessionUpdateData, ThrowOnError>) {
    return (options.client ?? this._client).patch<SessionUpdateResponses, SessionUpdateErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 获取会话的子会话
   */
  public children<ThrowOnError extends boolean = false>(options: Options<SessionChildrenData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionChildrenResponses, SessionChildrenErrors, ThrowOnError>({
      url: "/session/{id}/children",
      ...options,
    })
  }

  /**
   * 获取会话的待办列表
   */
  public todo<ThrowOnError extends boolean = false>(options: Options<SessionTodoData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionTodoResponses, SessionTodoErrors, ThrowOnError>({
      url: "/session/{id}/todo",
      ...options,
    })
  }

  /**
   * 分析应用并创建 AGENTS.md 文件
   */
  public init<ThrowOnError extends boolean = false>(options: Options<SessionInitData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionInitResponses, SessionInitErrors, ThrowOnError>({
      url: "/session/{id}/init",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 在指定消息处分叉现有会话
   */
  public fork<ThrowOnError extends boolean = false>(options: Options<SessionForkData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionForkResponses, unknown, ThrowOnError>({
      url: "/session/{id}/fork",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 中止会话
   */
  public abort<ThrowOnError extends boolean = false>(options: Options<SessionAbortData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionAbortResponses, SessionAbortErrors, ThrowOnError>({
      url: "/session/{id}/abort",
      ...options,
    })
  }

  /**
   * 取消共享会话
   */
  public unshare<ThrowOnError extends boolean = false>(options: Options<SessionUnshareData, ThrowOnError>) {
    return (options.client ?? this._client).delete<SessionUnshareResponses, SessionUnshareErrors, ThrowOnError>({
      url: "/session/{id}/share",
      ...options,
    })
  }

  /**
   * 共享会话
   */
  public share<ThrowOnError extends boolean = false>(options: Options<SessionShareData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionShareResponses, SessionShareErrors, ThrowOnError>({
      url: "/session/{id}/share",
      ...options,
    })
  }

  /**
   * 获取此会话的差异
   */
  public diff<ThrowOnError extends boolean = false>(options: Options<SessionDiffData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionDiffResponses, SessionDiffErrors, ThrowOnError>({
      url: "/session/{id}/diff",
      ...options,
    })
  }

  /**
   * 总结会话
   */
  public summarize<ThrowOnError extends boolean = false>(options: Options<SessionSummarizeData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionSummarizeResponses, SessionSummarizeErrors, ThrowOnError>({
      url: "/session/{id}/summarize",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 列出会话消息
   */
  public messages<ThrowOnError extends boolean = false>(options: Options<SessionMessagesData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionMessagesResponses, SessionMessagesErrors, ThrowOnError>({
      url: "/session/{id}/message",
      ...options,
    })
  }

  /**
   * 创建新消息并发送到会话
   */
  public prompt<ThrowOnError extends boolean = false>(options: Options<SessionPromptData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionPromptResponses, SessionPromptErrors, ThrowOnError>({
      url: "/session/{id}/message",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 获取会话中的消息
   */
  public message<ThrowOnError extends boolean = false>(options: Options<SessionMessageData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionMessageResponses, SessionMessageErrors, ThrowOnError>({
      url: "/session/{id}/message/{messageID}",
      ...options,
    })
  }

  /**
   * 创建新消息并发送到会话，在需要时启动会话并立即返回
   */
  public promptAsync<ThrowOnError extends boolean = false>(options: Options<SessionPromptAsyncData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionPromptAsyncResponses, SessionPromptAsyncErrors, ThrowOnError>({
      url: "/session/{id}/prompt_async",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 向会话发送新命令
   */
  public command<ThrowOnError extends boolean = false>(options: Options<SessionCommandData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionCommandResponses, SessionCommandErrors, ThrowOnError>({
      url: "/session/{id}/command",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 运行 shell 命令
   */
  public shell<ThrowOnError extends boolean = false>(options: Options<SessionShellData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionShellResponses, SessionShellErrors, ThrowOnError>({
      url: "/session/{id}/shell",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 还原消息
   */
  public revert<ThrowOnError extends boolean = false>(options: Options<SessionRevertData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionRevertResponses, SessionRevertErrors, ThrowOnError>({
      url: "/session/{id}/revert",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 恢复所有已还原的消息
   */
  public unrevert<ThrowOnError extends boolean = false>(options: Options<SessionUnrevertData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionUnrevertResponses, SessionUnrevertErrors, ThrowOnError>({
      url: "/session/{id}/unrevert",
      ...options,
    })
  }
}

class Command extends _HeyApiClient {
  /**
   * 列出所有命令
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<CommandListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<CommandListResponses, unknown, ThrowOnError>({
      url: "/command",
      ...options,
    })
  }
}

class Oauth extends _HeyApiClient {
  /**
   * 使用 OAuth 授权提供商
   */
  public authorize<ThrowOnError extends boolean = false>(options: Options<ProviderOauthAuthorizeData, ThrowOnError>) {
    return (options.client ?? this._client).post<
      ProviderOauthAuthorizeResponses,
      ProviderOauthAuthorizeErrors,
      ThrowOnError
    >({
      url: "/provider/{id}/oauth/authorize",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 处理提供商的 OAuth 回调
   */
  public callback<ThrowOnError extends boolean = false>(options: Options<ProviderOauthCallbackData, ThrowOnError>) {
    return (options.client ?? this._client).post<
      ProviderOauthCallbackResponses,
      ProviderOauthCallbackErrors,
      ThrowOnError
    >({
      url: "/provider/{id}/oauth/callback",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
}

class Provider extends _HeyApiClient {
  /**
   * 列出所有提供商
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<ProviderListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProviderListResponses, unknown, ThrowOnError>({
      url: "/provider",
      ...options,
    })
  }

  /**
   * 获取提供商身份验证方式
   */
  public auth<ThrowOnError extends boolean = false>(options?: Options<ProviderAuthData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProviderAuthResponses, unknown, ThrowOnError>({
      url: "/provider/auth",
      ...options,
    })
  }
  oauth = new Oauth({ client: this._client })
}

class Find extends _HeyApiClient {
  /**
   * 在文件中查找文本
   */
  public text<ThrowOnError extends boolean = false>(options: Options<FindTextData, ThrowOnError>) {
    return (options.client ?? this._client).get<FindTextResponses, unknown, ThrowOnError>({
      url: "/find",
      ...options,
    })
  }

  /**
   * 查找文件
   */
  public files<ThrowOnError extends boolean = false>(options: Options<FindFilesData, ThrowOnError>) {
    return (options.client ?? this._client).get<FindFilesResponses, unknown, ThrowOnError>({
      url: "/find/file",
      ...options,
    })
  }

  /**
   * 查找工作区符号
   */
  public symbols<ThrowOnError extends boolean = false>(options: Options<FindSymbolsData, ThrowOnError>) {
    return (options.client ?? this._client).get<FindSymbolsResponses, unknown, ThrowOnError>({
      url: "/find/symbol",
      ...options,
    })
  }
}

class File extends _HeyApiClient {
  /**
   * 列出文件和目录
   */
  public list<ThrowOnError extends boolean = false>(options: Options<FileListData, ThrowOnError>) {
    return (options.client ?? this._client).get<FileListResponses, unknown, ThrowOnError>({
      url: "/file",
      ...options,
    })
  }

  /**
   * 读取文件
   */
  public read<ThrowOnError extends boolean = false>(options: Options<FileReadData, ThrowOnError>) {
    return (options.client ?? this._client).get<FileReadResponses, unknown, ThrowOnError>({
      url: "/file/content",
      ...options,
    })
  }

  /**
   * 获取文件状态
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<FileStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<FileStatusResponses, unknown, ThrowOnError>({
      url: "/file/status",
      ...options,
    })
  }
}

class App extends _HeyApiClient {
  /**
   * 向服务器日志写入日志条目
   */
  public log<ThrowOnError extends boolean = false>(options?: Options<AppLogData, ThrowOnError>) {
    return (options?.client ?? this._client).post<AppLogResponses, AppLogErrors, ThrowOnError>({
      url: "/log",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 列出所有代理
   */
  public agents<ThrowOnError extends boolean = false>(options?: Options<AppAgentsData, ThrowOnError>) {
    return (options?.client ?? this._client).get<AppAgentsResponses, unknown, ThrowOnError>({
      url: "/agent",
      ...options,
    })
  }
}

class Auth extends _HeyApiClient {
  /**
   * 移除 MCP 服务器的 OAuth 凭据
   */
  public remove<ThrowOnError extends boolean = false>(options: Options<McpAuthRemoveData, ThrowOnError>) {
    return (options.client ?? this._client).delete<McpAuthRemoveResponses, McpAuthRemoveErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
    })
  }

  /**
   * 启动 MCP 服务器的 OAuth 身份验证流程
   */
  public start<ThrowOnError extends boolean = false>(options: Options<McpAuthStartData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpAuthStartResponses, McpAuthStartErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
    })
  }

  /**
   * 使用授权码完成 OAuth 身份验证
   */
  public callback<ThrowOnError extends boolean = false>(options: Options<McpAuthCallbackData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpAuthCallbackResponses, McpAuthCallbackErrors, ThrowOnError>({
      url: "/mcp/{name}/auth/callback",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * 启动 OAuth 流程并等待回调（打开浏览器）
   */
  public authenticate<ThrowOnError extends boolean = false>(options: Options<McpAuthAuthenticateData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpAuthAuthenticateResponses, McpAuthAuthenticateErrors, ThrowOnError>(
      {
        url: "/mcp/{name}/auth/authenticate",
        ...options,
      },
    )
  }

  /**
   * 设置身份验证凭据
   */
  public set<ThrowOnError extends boolean = false>(options: Options<AuthSetData, ThrowOnError>) {
    return (options.client ?? this._client).put<AuthSetResponses, AuthSetErrors, ThrowOnError>({
      url: "/auth/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
}

class Mcp extends _HeyApiClient {
  /**
   * 获取 MCP 服务器状态
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<McpStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<McpStatusResponses, unknown, ThrowOnError>({
      url: "/mcp",
      ...options,
    })
  }

  /**
   * 动态添加 MCP 服务器
   */
  public add<ThrowOnError extends boolean = false>(options?: Options<McpAddData, ThrowOnError>) {
    return (options?.client ?? this._client).post<McpAddResponses, McpAddErrors, ThrowOnError>({
      url: "/mcp",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 连接 MCP 服务器
   */
  public connect<ThrowOnError extends boolean = false>(options: Options<McpConnectData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpConnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/connect",
      ...options,
    })
  }

  /**
   * 断开 MCP 服务器连接
   */
  public disconnect<ThrowOnError extends boolean = false>(options: Options<McpDisconnectData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpDisconnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/disconnect",
      ...options,
    })
  }

  auth = new Auth({ client: this._client })
}

class Lsp extends _HeyApiClient {
  /**
   * 获取 LSP 服务器状态
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<LspStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<LspStatusResponses, unknown, ThrowOnError>({
      url: "/lsp",
      ...options,
    })
  }
}

class Formatter extends _HeyApiClient {
  /**
   * 获取格式化程序状态
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<FormatterStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<FormatterStatusResponses, unknown, ThrowOnError>({
      url: "/formatter",
      ...options,
    })
  }
}

class Control extends _HeyApiClient {
  /**
   * 从队列获取下一个 TUI 请求
   */
  public next<ThrowOnError extends boolean = false>(options?: Options<TuiControlNextData, ThrowOnError>) {
    return (options?.client ?? this._client).get<TuiControlNextResponses, unknown, ThrowOnError>({
      url: "/tui/control/next",
      ...options,
    })
  }

  /**
   * 向 TUI 请求队列提交响应
   */
  public response<ThrowOnError extends boolean = false>(options?: Options<TuiControlResponseData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiControlResponseResponses, unknown, ThrowOnError>({
      url: "/tui/control/response",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }
}

class Tui extends _HeyApiClient {
  /**
   * 向 TUI 追加提示
   */
  public appendPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiAppendPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiAppendPromptResponses, TuiAppendPromptErrors, ThrowOnError>({
      url: "/tui/append-prompt",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 打开帮助对话框
   */
  public openHelp<ThrowOnError extends boolean = false>(options?: Options<TuiOpenHelpData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenHelpResponses, unknown, ThrowOnError>({
      url: "/tui/open-help",
      ...options,
    })
  }

  /**
   * 打开会话对话框
   */
  public openSessions<ThrowOnError extends boolean = false>(options?: Options<TuiOpenSessionsData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenSessionsResponses, unknown, ThrowOnError>({
      url: "/tui/open-sessions",
      ...options,
    })
  }

  /**
   * 打开主题对话框
   */
  public openThemes<ThrowOnError extends boolean = false>(options?: Options<TuiOpenThemesData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenThemesResponses, unknown, ThrowOnError>({
      url: "/tui/open-themes",
      ...options,
    })
  }

  /**
   * 打开模型对话框
   */
  public openModels<ThrowOnError extends boolean = false>(options?: Options<TuiOpenModelsData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenModelsResponses, unknown, ThrowOnError>({
      url: "/tui/open-models",
      ...options,
    })
  }

  /**
   * 提交提示
   */
  public submitPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiSubmitPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiSubmitPromptResponses, unknown, ThrowOnError>({
      url: "/tui/submit-prompt",
      ...options,
    })
  }

  /**
   * 清除提示
   */
  public clearPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiClearPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiClearPromptResponses, unknown, ThrowOnError>({
      url: "/tui/clear-prompt",
      ...options,
    })
  }

  /**
   * 执行 TUI 命令（例如 agent_cycle）
   */
  public executeCommand<ThrowOnError extends boolean = false>(options?: Options<TuiExecuteCommandData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiExecuteCommandResponses, TuiExecuteCommandErrors, ThrowOnError>({
      url: "/tui/execute-command",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 在 TUI 中显示通知
   */
  public showToast<ThrowOnError extends boolean = false>(options?: Options<TuiShowToastData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiShowToastResponses, unknown, ThrowOnError>({
      url: "/tui/show-toast",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * 发布 TUI 事件
   */
  public publish<ThrowOnError extends boolean = false>(options?: Options<TuiPublishData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiPublishResponses, TuiPublishErrors, ThrowOnError>({
      url: "/tui/publish",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }
  control = new Control({ client: this._client })
}

class Event extends _HeyApiClient {
  /**
   * 获取事件
   */
  public subscribe<ThrowOnError extends boolean = false>(options?: Options<EventSubscribeData, ThrowOnError>) {
    return (options?.client ?? this._client).get.sse<EventSubscribeResponses, unknown, ThrowOnError>({
      url: "/event",
      ...options,
    })
  }
}

export class MiaopanCodeClient extends _HeyApiClient {
  /**
   * 响应权限请求
   */
  public postSessionIdPermissionsPermissionId<ThrowOnError extends boolean = false>(
    options: Options<PostSessionIdPermissionsPermissionIdData, ThrowOnError>,
  ) {
    return (options.client ?? this._client).post<
      PostSessionIdPermissionsPermissionIdResponses,
      PostSessionIdPermissionsPermissionIdErrors,
      ThrowOnError
    >({
      url: "/session/{id}/permissions/{permissionID}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
  global = new Global({ client: this._client })
  project = new Project({ client: this._client })
  pty = new Pty({ client: this._client })
  config = new Config({ client: this._client })
  tool = new Tool({ client: this._client })
  instance = new Instance({ client: this._client })
  path = new Path({ client: this._client })
  vcs = new Vcs({ client: this._client })
  session = new Session({ client: this._client })
  command = new Command({ client: this._client })
  provider = new Provider({ client: this._client })
  find = new Find({ client: this._client })
  file = new File({ client: this._client })
  app = new App({ client: this._client })
  mcp = new Mcp({ client: this._client })
  lsp = new Lsp({ client: this._client })
  formatter = new Formatter({ client: this._client })
  tui = new Tui({ client: this._client })
  auth = new Auth({ client: this._client })
  event = new Event({ client: this._client })
}
