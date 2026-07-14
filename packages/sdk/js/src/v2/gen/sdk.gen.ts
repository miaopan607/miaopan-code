// 此文件由 @hey-api/openapi-ts 自动生成

import { t, type Language } from "../../i18n.js"

import { client } from "./client.gen.js"
import { buildClientParams, type Client, type Options as Options2, type TDataShape } from "./client/index.js"
import type {
  AgentPartInput,
  AppAgentsErrors,
  AppAgentsResponses,
  AppLogErrors,
  AppLogResponses,
  AppSkillsErrors,
  AppSkillsResponses,
  Auth as Auth3,
  AuthRemoveErrors,
  AuthRemoveResponses,
  AuthSetErrors,
  AuthSetResponses,
  CommandListErrors,
  CommandListResponses,
  Config as Config3,
  ConfigGetErrors,
  ConfigGetResponses,
  ConfigProvidersErrors,
  ConfigProvidersRefreshErrors,
  ConfigProvidersRefreshResponses,
  ConfigProvidersResponses,
  ConfigUpdateErrors,
  ConfigUpdateResponses,
  EventSubscribeResponses,
  EventTuiCommandExecute,
  EventTuiPromptAppend,
  EventTuiSessionSelect,
  EventTuiToastShow,
  ExperimentalCapabilitiesGetErrors,
  ExperimentalCapabilitiesGetResponses,
  ExperimentalConsoleGetErrors,
  ExperimentalConsoleGetResponses,
  ExperimentalConsoleListOrgsErrors,
  ExperimentalConsoleListOrgsResponses,
  ExperimentalConsoleSwitchOrgResponses,
  ExperimentalControlPlaneMoveSessionErrors,
  ExperimentalControlPlaneMoveSessionResponses,
  ExperimentalProjectCopyGenerateNameErrors,
  ExperimentalProjectCopyGenerateNameResponses,
  ExperimentalResourceListErrors,
  ExperimentalResourceListResponses,
  ExperimentalSessionBackgroundErrors,
  ExperimentalSessionBackgroundResponses,
  ExperimentalSessionListErrors,
  ExperimentalSessionListResponses,
  ExperimentalWorkspaceAdapterListErrors,
  ExperimentalWorkspaceAdapterListResponses,
  ExperimentalWorkspaceCreateErrors,
  ExperimentalWorkspaceCreateResponses,
  ExperimentalWorkspaceListErrors,
  ExperimentalWorkspaceListResponses,
  ExperimentalWorkspaceRemoveErrors,
  ExperimentalWorkspaceRemoveResponses,
  ExperimentalWorkspaceStatusErrors,
  ExperimentalWorkspaceStatusResponses,
  ExperimentalWorkspaceSyncListErrors,
  ExperimentalWorkspaceSyncListResponses,
  ExperimentalWorkspaceWarpErrors,
  ExperimentalWorkspaceWarpResponses,
  FileListErrors,
  FileListResponses,
  FilePartInput,
  FilePartSource,
  FileReadErrors,
  FileReadResponses,
  FileStatusErrors,
  FileStatusResponses,
  FindFilesErrors,
  FindFilesResponses,
  FindSymbolsErrors,
  FindSymbolsResponses,
  FindTextErrors,
  FindTextResponses,
  FormatterStatusErrors,
  FormatterStatusResponses,
  GlobalConfigGetErrors,
  GlobalConfigGetResponses,
  GlobalConfigUpdateErrors,
  GlobalConfigUpdateResponses,
  GlobalDisposeErrors,
  GlobalDisposeResponses,
  GlobalEventErrors,
  GlobalEventResponses,
  GlobalHealthErrors,
  GlobalHealthResponses,
  GlobalUpgradeErrors,
  GlobalUpgradeResponses,
  InstanceDisposeErrors,
  InstanceDisposeResponses,
  LocationRef,
  LspStatusErrors,
  LspStatusResponses,
  McpAddErrors,
  McpAddResponses,
  McpAuthAuthenticateErrors,
  McpAuthAuthenticateResponses,
  McpAuthCallbackErrors,
  McpAuthCallbackResponses,
  McpAuthRemoveErrors,
  McpAuthRemoveResponses,
  McpAuthStartErrors,
  McpAuthStartResponses,
  McpConnectErrors,
  McpConnectResponses,
  McpDisconnectErrors,
  McpDisconnectResponses,
  McpLocalConfig,
  McpRemoteConfig,
  McpStatusErrors,
  McpStatusResponses,
  ModelRef,
  MoveSessionDestination,
  OutputFormat,
  Part as Part2,
  PartDeleteErrors,
  PartDeleteResponses,
  PartUpdateErrors,
  PartUpdateResponses,
  PathGetErrors,
  PathGetResponses,
  PermissionListErrors,
  PermissionListResponses,
  PermissionReplyErrors,
  PermissionReplyResponses,
  PermissionRespondErrors,
  PermissionRespondResponses,
  PermissionRuleset,
  PermissionV2Reply,
  PermissionV2Source,
  ProjectCommands,
  ProjectCurrentErrors,
  ProjectCurrentResponses,
  ProjectDirectoriesErrors,
  ProjectDirectoriesResponses,
  ProjectIcon,
  ProjectInitGitErrors,
  ProjectInitGitResponses,
  ProjectListErrors,
  ProjectListResponses,
  ProjectUpdateErrors,
  ProjectUpdateResponses,
  PromptInput,
  ProviderAuthErrors,
  ProviderAuthResponses,
  ProviderListErrors,
  ProviderListResponses,
  ProviderOauthAuthorizeErrors,
  ProviderOauthAuthorizeResponses,
  ProviderOauthCallbackErrors,
  ProviderOauthCallbackResponses,
  PtyConnectErrors,
  PtyConnectResponses,
  PtyConnectTokenErrors,
  PtyConnectTokenResponses,
  PtyCreateErrors,
  PtyCreateResponses,
  PtyGetErrors,
  PtyGetResponses,
  PtyListErrors,
  PtyListResponses,
  PtyRemoveErrors,
  PtyRemoveResponses,
  PtyShellsErrors,
  PtyShellsResponses,
  PtyUpdateErrors,
  PtyUpdateResponses,
  QuestionAnswer,
  QuestionListErrors,
  QuestionListResponses,
  QuestionRejectErrors,
  QuestionRejectResponses,
  QuestionReplyErrors,
  QuestionReplyResponses,
  QuestionV2Reply,
  SessionAbortErrors,
  SessionAbortResponses,
  SessionChildrenErrors,
  SessionChildrenResponses,
  SessionCommandErrors,
  SessionCommandResponses,
  SessionContinueErrors,
  SessionContinueResponses,
  SessionCreateErrors,
  SessionCreateResponses,
  SessionDeleteErrors,
  SessionDeleteMessageErrors,
  SessionDeleteMessageResponses,
  SessionDeleteResponses,
  SessionDiffErrors,
  SessionDiffResponses,
  SessionForkErrors,
  SessionForkResponses,
  SessionGetErrors,
  SessionGetResponses,
  SessionInitErrors,
  SessionInitResponses,
  SessionListErrors,
  SessionListResponses,
  SessionMessageErrors,
  SessionMessageResponses,
  SessionMessagesErrors,
  SessionMessagesResponses,
  SessionPromptAsyncErrors,
  SessionPromptAsyncResponses,
  SessionPromptErrors,
  SessionPromptResponses,
  SessionRevertErrors,
  SessionRevertResponses,
  SessionShareErrors,
  SessionShareResponses,
  SessionShellErrors,
  SessionShellResponses,
  SessionStatusErrors,
  SessionStatusResponses,
  SessionSummarizeErrors,
  SessionSummarizeResponses,
  SessionTodoErrors,
  SessionTodoResponses,
  SessionUnrevertErrors,
  SessionUnrevertResponses,
  SessionUnshareErrors,
  SessionUnshareResponses,
  SessionUpdateErrors,
  SessionUpdateResponses,
  SubtaskPartInput,
  SyncHistoryListErrors,
  SyncHistoryListResponses,
  SyncReplayErrors,
  SyncReplayResponses,
  SyncStartErrors,
  SyncStartResponses,
  SyncStealErrors,
  SyncStealResponses,
  TextPartInput,
  ToolIdsErrors,
  ToolIdsResponses,
  ToolListErrors,
  ToolListResponses,
  TuiAppendPromptErrors,
  TuiAppendPromptResponses,
  TuiClearPromptErrors,
  TuiClearPromptResponses,
  TuiControlNextErrors,
  TuiControlNextResponses,
  TuiControlResponseErrors,
  TuiControlResponseResponses,
  TuiExecuteCommandErrors,
  TuiExecuteCommandResponses,
  TuiOpenHelpErrors,
  TuiOpenHelpResponses,
  TuiOpenModelsErrors,
  TuiOpenModelsResponses,
  TuiOpenSessionsErrors,
  TuiOpenSessionsResponses,
  TuiOpenThemesErrors,
  TuiOpenThemesResponses,
  TuiPublishErrors,
  TuiPublishResponses,
  TuiSelectSessionErrors,
  TuiSelectSessionResponses,
  TuiShowToastErrors,
  TuiShowToastResponses,
  TuiSubmitPromptErrors,
  TuiSubmitPromptResponses,
  V2AgentListErrors,
  V2AgentListResponses,
  V2CommandListErrors,
  V2CommandListResponses,
  V2CredentialRemoveErrors,
  V2CredentialRemoveResponses,
  V2CredentialUpdateErrors,
  V2CredentialUpdateResponses,
  V2EventSubscribeErrors,
  V2EventSubscribeResponses,
  V2FsFindErrors,
  V2FsFindResponses,
  V2FsListErrors,
  V2FsListResponses,
  V2FsReadErrors,
  V2FsReadResponses,
  V2HealthGetErrors,
  V2HealthGetResponses,
  V2IntegrationAttemptCancelErrors,
  V2IntegrationAttemptCancelResponses,
  V2IntegrationAttemptCompleteErrors,
  V2IntegrationAttemptCompleteResponses,
  V2IntegrationAttemptStatusErrors,
  V2IntegrationAttemptStatusResponses,
  V2IntegrationConnectKeyErrors,
  V2IntegrationConnectKeyResponses,
  V2IntegrationConnectOauthErrors,
  V2IntegrationConnectOauthResponses,
  V2IntegrationGetErrors,
  V2IntegrationGetResponses,
  V2IntegrationListErrors,
  V2IntegrationListResponses,
  V2LocationGetErrors,
  V2LocationGetResponses,
  V2ModelListErrors,
  V2ModelListResponses,
  V2PermissionRequestListErrors,
  V2PermissionRequestListResponses,
  V2PermissionSavedListErrors,
  V2PermissionSavedListResponses,
  V2PermissionSavedRemoveErrors,
  V2PermissionSavedRemoveResponses,
  V2ProjectCopyCreateErrors,
  V2ProjectCopyCreateResponses,
  V2ProjectCopyRefreshErrors,
  V2ProjectCopyRefreshResponses,
  V2ProjectCopyRemoveErrors,
  V2ProjectCopyRemoveResponses,
  V2ProviderGetErrors,
  V2ProviderGetResponses,
  V2ProviderListErrors,
  V2ProviderListResponses,
  V2PtyConnectErrors,
  V2PtyConnectResponses,
  V2PtyConnectTokenErrors,
  V2PtyConnectTokenResponses,
  V2PtyCreateErrors,
  V2PtyCreateResponses,
  V2PtyGetErrors,
  V2PtyGetResponses,
  V2PtyListErrors,
  V2PtyListResponses,
  V2PtyRemoveErrors,
  V2PtyRemoveResponses,
  V2PtyUpdateErrors,
  V2PtyUpdateResponses,
  V2QuestionRequestListErrors,
  V2QuestionRequestListResponses,
  V2ReferenceListErrors,
  V2ReferenceListResponses,
  V2SessionActiveErrors,
  V2SessionActiveResponses,
  V2SessionCompactErrors,
  V2SessionCompactResponses,
  V2SessionContextErrors,
  V2SessionContextResponses,
  V2SessionCreateErrors,
  V2SessionCreateResponses,
  V2SessionEventsErrors,
  V2SessionEventsResponses,
  V2SessionGetErrors,
  V2SessionGetResponses,
  V2SessionHistoryErrors,
  V2SessionHistoryResponses,
  V2SessionInterruptErrors,
  V2SessionInterruptResponses,
  V2SessionListErrors,
  V2SessionListResponses,
  V2SessionMessageErrors,
  V2SessionMessageResponses,
  V2SessionMessagesErrors,
  V2SessionMessagesResponses,
  V2SessionPermissionCreateErrors,
  V2SessionPermissionCreateResponses,
  V2SessionPermissionGetErrors,
  V2SessionPermissionGetResponses,
  V2SessionPermissionListErrors,
  V2SessionPermissionListResponses,
  V2SessionPermissionReplyErrors,
  V2SessionPermissionReplyResponses,
  V2SessionPromptErrors,
  V2SessionPromptResponses,
  V2SessionQuestionListErrors,
  V2SessionQuestionListResponses,
  V2SessionQuestionRejectErrors,
  V2SessionQuestionRejectResponses,
  V2SessionQuestionReplyErrors,
  V2SessionQuestionReplyResponses,
  V2SessionRevertClearErrors,
  V2SessionRevertClearResponses,
  V2SessionRevertCommitErrors,
  V2SessionRevertCommitResponses,
  V2SessionRevertStageErrors,
  V2SessionRevertStageResponses,
  V2SessionSwitchAgentErrors,
  V2SessionSwitchAgentResponses,
  V2SessionSwitchModelErrors,
  V2SessionSwitchModelResponses,
  V2SessionWaitErrors,
  V2SessionWaitResponses,
  V2SkillListErrors,
  V2SkillListResponses,
  VcsApplyErrors,
  VcsApplyResponses,
  VcsDiffErrors,
  VcsDiffRawErrors,
  VcsDiffRawResponses,
  VcsDiffResponses,
  VcsGetErrors,
  VcsGetResponses,
  VcsStatusErrors,
  VcsStatusResponses,
  WorktreeCreateErrors,
  WorktreeCreateInput,
  WorktreeCreateResponses,
  WorktreeListErrors,
  WorktreeListResponses,
  WorktreeRemoveErrors,
  WorktreeRemoveInput,
  WorktreeRemoveResponses,
  WorktreeResetErrors,
  WorktreeResetInput,
  WorktreeResetResponses,
} from "./types.gen.js"

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = Options2<
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

class HeyApiClient {
  protected client: Client

  constructor(args?: { client?: Client }) {
    this.client = args?.client ?? client
  }
}

class HeyApiRegistry<T> {
  private readonly defaultKey = "default"

  private readonly instances: Map<string, T> = new Map()
  private language?: Language

  get(key?: string): T {
    const instance = this.instances.get(key ?? this.defaultKey)
    if (!instance) {
      throw new Error(t(this.language, "generated_sdk_client_missing"))
    }
    return instance
  }

  set(value: T, key?: string, language?: Language): void {
    this.language = language ?? this.language
    this.instances.set(key ?? this.defaultKey, value)
  }
}

export class Auth extends HeyApiClient {
  /**
   * 移除身份验证凭据
   *
   * 移除身份验证凭据
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "providerID" }] }])
    return (options?.client ?? this.client).delete<AuthRemoveResponses, AuthRemoveErrors, ThrowOnError>({
      url: "/auth/{providerID}",
      ...options,
      ...params,
    })
  }

  /**
   * 设置身份验证凭据
   *
   * 设置身份验证凭据
   */
  public set<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      auth?: Auth3
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { key: "auth", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put<AuthSetResponses, AuthSetErrors, ThrowOnError>({
      url: "/auth/{providerID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class App extends HeyApiClient {
  /**
   * 写入日志
   *
   * 使用指定级别和元数据向服务器日志写入日志条目。
   */
  public log<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      service?: string
      level?: "debug" | "info" | "error" | "warn"
      message?: string
      extra?: {
        [key: string]: unknown
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "service" },
            { in: "body", key: "level" },
            { in: "body", key: "message" },
            { in: "body", key: "extra" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<AppLogResponses, AppLogErrors, ThrowOnError>({
      url: "/log",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 列出代理
   *
   * 获取 MiaopanCode 系统中的所有可用 AI 代理。
   */
  public agents<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<AppAgentsResponses, AppAgentsErrors, ThrowOnError>({
      url: "/agent",
      ...options,
      ...params,
    })
  }

  /**
   * 列出技能
   *
   * 获取 MiaopanCode 系统中的所有可用技能。
   */
  public skills<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<AppSkillsResponses, AppSkillsErrors, ThrowOnError>({
      url: "/skill",
      ...options,
      ...params,
    })
  }
}

export class ControlPlane extends HeyApiClient {
  /**
   * 移动会话
   *
   * 将会话移动到另一个项目目录，可选地转移本地更改。
   */
  public moveSession<ThrowOnError extends boolean = false>(
    parameters?: {
      sessionID?: string
      destination?: MoveSessionDestination
      moveChanges?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "body", key: "sessionID" },
            { in: "body", key: "destination" },
            { in: "body", key: "moveChanges" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalControlPlaneMoveSessionResponses,
      ExperimentalControlPlaneMoveSessionErrors,
      ThrowOnError
    >({
      url: "/experimental/control-plane/move-session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Capabilities extends HeyApiClient {
  /**
   * 获取实验能力
   *
   * 获取 MiaopanCode 服务器启用的实验功能。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalCapabilitiesGetResponses,
      ExperimentalCapabilitiesGetErrors,
      ThrowOnError
    >({
      url: "/experimental/capabilities",
      ...options,
      ...params,
    })
  }
}

export class Console extends HeyApiClient {
  /**
   * 获取活动 Console 提供商元数据
   *
   * 获取活动 Console 组织名称及由该组织管理的提供商 ID。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalConsoleGetResponses,
      ExperimentalConsoleGetErrors,
      ThrowOnError
    >({
      url: "/experimental/console",
      ...options,
      ...params,
    })
  }

  /**
   * 列出可切换的 Console 组织
   *
   * 获取已登录账号中的可用 Console 组织，包括当前活动组织。
   */
  public listOrgs<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalConsoleListOrgsResponses,
      ExperimentalConsoleListOrgsErrors,
      ThrowOnError
    >({
      url: "/experimental/console/orgs",
      ...options,
      ...params,
    })
  }

  /**
   * 切换活动 Console 组织
   *
   * 为当前本地 MiaopanCode 状态保存新的活动 Console 账号/组织选择。
   */
  public switchOrg<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      accountID?: string
      orgID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "accountID" },
            { in: "body", key: "orgID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<ExperimentalConsoleSwitchOrgResponses, unknown, ThrowOnError>({
      url: "/experimental/console/switch",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Session extends HeyApiClient {
  /**
   * 列出会话
   *
   * 获取所有项目中的 MiaopanCode 会话，并按最近更新时间排序；默认不包含已归档会话。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      roots?: boolean | "true" | "false"
      start?: number
      cursor?: number
      search?: string
      limit?: number
      archived?: boolean | "true" | "false"
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "roots" },
            { in: "query", key: "start" },
            { in: "query", key: "cursor" },
            { in: "query", key: "search" },
            { in: "query", key: "limit" },
            { in: "query", key: "archived" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalSessionListResponses,
      ExperimentalSessionListErrors,
      ThrowOnError
    >({
      url: "/experimental/session",
      ...options,
      ...params,
    })
  }

  /**
   * 后台子代理
   *
   * 分离当前阻塞会话的同步子代理，并让它们在后台继续运行。
   */
  public background<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalSessionBackgroundResponses,
      ExperimentalSessionBackgroundErrors,
      ThrowOnError
    >({
      url: "/experimental/session/{sessionID}/background",
      ...options,
      ...params,
    })
  }
}

export class Resource extends HeyApiClient {
  /**
   * 获取 MCP 资源
   *
   * 从已连接服务器获取所有可用 MCP 资源，可按名称筛选。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalResourceListResponses,
      ExperimentalResourceListErrors,
      ThrowOnError
    >({
      url: "/experimental/resource",
      ...options,
      ...params,
    })
  }
}

export class ProjectCopy extends HeyApiClient {
  /**
   * 生成项目副本名称
   *
   * 根据任务上下文生成项目副本的简短名称。
   */
  public generateName<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      directory?: string
      workspace?: string
      context?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "context" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalProjectCopyGenerateNameResponses,
      ExperimentalProjectCopyGenerateNameErrors,
      ThrowOnError
    >({
      url: "/experimental/project/{projectID}/copy/generate-name",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Adapter extends HeyApiClient {
  /**
   * 列出工作区适配器
   *
   * 列出当前项目的所有可用工作区适配器。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalWorkspaceAdapterListResponses,
      ExperimentalWorkspaceAdapterListErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/adapter",
      ...options,
      ...params,
    })
  }
}

export class Workspace extends HeyApiClient {
  /**
   * 列出工作区
   *
   * 列出所有工作区。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalWorkspaceListResponses,
      ExperimentalWorkspaceListErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace",
      ...options,
      ...params,
    })
  }

  /**
   * 创建工作区
   *
   * 为当前项目创建工作区。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      id?: string
      type?: string
      branch?: string | null
      extra?: unknown | null
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "id" },
            { in: "body", key: "type" },
            { in: "body", key: "branch" },
            { in: "body", key: "extra" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalWorkspaceCreateResponses,
      ExperimentalWorkspaceCreateErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 同步工作区列表
   *
   * 注册工作区适配器返回的缺失工作区。
   */
  public syncList<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalWorkspaceSyncListResponses,
      ExperimentalWorkspaceSyncListErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/sync-list",
      ...options,
      ...params,
    })
  }

  /**
   * 工作区状态
   *
   * 获取当前项目工作区的连接状态。
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalWorkspaceStatusResponses,
      ExperimentalWorkspaceStatusErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/status",
      ...options,
      ...params,
    })
  }

  /**
   * 移除工作区
   *
   * 移除现有工作区。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      id: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "id" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<
      ExperimentalWorkspaceRemoveResponses,
      ExperimentalWorkspaceRemoveErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/{id}",
      ...options,
      ...params,
    })
  }

  /**
   * 将会话转入工作区
   *
   * 将会话同步历史移动到目标工作区，或将其分离到本地项目。
   */
  public warp<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      id?: string | null
      sessionID?: string
      copyChanges?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "id" },
            { in: "body", key: "sessionID" },
            { in: "body", key: "copyChanges" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalWorkspaceWarpResponses,
      ExperimentalWorkspaceWarpErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/warp",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _adapter?: Adapter
  get adapter(): Adapter {
    return (this._adapter ??= new Adapter({ client: this.client }))
  }
}

export class Experimental extends HeyApiClient {
  private _controlPlane?: ControlPlane
  get controlPlane(): ControlPlane {
    return (this._controlPlane ??= new ControlPlane({ client: this.client }))
  }

  private _capabilities?: Capabilities
  get capabilities(): Capabilities {
    return (this._capabilities ??= new Capabilities({ client: this.client }))
  }

  private _console?: Console
  get console(): Console {
    return (this._console ??= new Console({ client: this.client }))
  }

  private _session?: Session
  get session(): Session {
    return (this._session ??= new Session({ client: this.client }))
  }

  private _resource?: Resource
  get resource(): Resource {
    return (this._resource ??= new Resource({ client: this.client }))
  }

  private _projectCopy?: ProjectCopy
  get projectCopy(): ProjectCopy {
    return (this._projectCopy ??= new ProjectCopy({ client: this.client }))
  }

  private _workspace?: Workspace
  get workspace(): Workspace {
    return (this._workspace ??= new Workspace({ client: this.client }))
  }
}

export class Config extends HeyApiClient {
  /**
   * 获取全局配置
   *
   * 获取当前全局 MiaopanCode 配置设置和偏好。
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).get<GlobalConfigGetResponses, GlobalConfigGetErrors, ThrowOnError>({
      url: "/global/config",
      ...options,
    })
  }

  /**
   * 更新全局配置
   *
   * 获取当前全局 MiaopanCode 配置设置和偏好。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters?: {
      config?: Config3
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ key: "config", map: "body" }] }])
    return (options?.client ?? this.client).patch<GlobalConfigUpdateResponses, GlobalConfigUpdateErrors, ThrowOnError>({
      url: "/global/config",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Global extends HeyApiClient {
  /**
   * 获取健康状态
   *
   * 获取 MiaopanCode 服务器的健康信息。
   */
  public health<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).get<GlobalHealthResponses, GlobalHealthErrors, ThrowOnError>({
      url: "/global/health",
      ...options,
    })
  }

  /**
   * 获取全局事件
   *
   * 通过服务器发送事件订阅 MiaopanCode 系统的全局事件。
   */
  public event<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).sse.get<GlobalEventResponses, GlobalEventErrors, ThrowOnError>({
      url: "/global/event",
      ...options,
    })
  }

  /**
   * 释放实例
   *
   * 清理并释放所有 MiaopanCode 实例，释放所有资源。
   */
  public dispose<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).post<GlobalDisposeResponses, GlobalDisposeErrors, ThrowOnError>({
      url: "/global/dispose",
      ...options,
    })
  }

  /**
   * 升级 miaopanCode
   *
   * 将 miaopanCode 升级到指定版本；未指定时升级到最新版本。
   */
  public upgrade<ThrowOnError extends boolean = false>(
    parameters?: {
      target?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "body", key: "target" }] }])
    return (options?.client ?? this.client).post<GlobalUpgradeResponses, GlobalUpgradeErrors, ThrowOnError>({
      url: "/global/upgrade",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _config?: Config
  get config(): Config {
    return (this._config ??= new Config({ client: this.client }))
  }
}

export class Event extends HeyApiClient {
  /**
   * 订阅会话事件
   *
   * 重放指定聚合序列之后的持久化事件，然后继续接收新的持久化事件。
   */
  public subscribe<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).sse.get<EventSubscribeResponses, unknown, ThrowOnError>({
      url: "/event",
      ...options,
      ...params,
    })
  }
}

export class Providers extends HeyApiClient {
  /**
   * 刷新配置提供商
   *
   * 重新读取当前目录配置并刷新 AI 提供商和模型列表。
   */
  public refresh<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ConfigProvidersRefreshResponses,
      ConfigProvidersRefreshErrors,
      ThrowOnError
    >({
      url: "/config/providers/refresh",
      ...options,
      ...params,
    })
  }
}

export class Config2 extends HeyApiClient {
  /**
   * 获取配置
   *
   * 获取当前 MiaopanCode 配置设置和偏好。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ConfigGetResponses, ConfigGetErrors, ThrowOnError>({
      url: "/config",
      ...options,
      ...params,
    })
  }

  /**
   * 更新配置
   *
   * 获取当前 MiaopanCode 配置设置和偏好。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      config?: Config3
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "config", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<ConfigUpdateResponses, ConfigUpdateErrors, ThrowOnError>({
      url: "/config",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 列出配置提供商
   *
   * 获取所有已配置 AI 提供商及其默认模型。
   */
  public providers<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ConfigProvidersResponses, ConfigProvidersErrors, ThrowOnError>({
      url: "/config/providers",
      ...options,
      ...params,
    })
  }

  private _providers?: Providers
  get providers2(): Providers {
    return (this._providers ??= new Providers({ client: this.client }))
  }
}

export class Tool extends HeyApiClient {
  /**
   * 列出工具
   *
   * 获取特定提供商和模型组合可用的工具及其 JSON Schema 参数。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      provider: string
      model: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "provider" },
            { in: "query", key: "model" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ToolListResponses, ToolListErrors, ThrowOnError>({
      url: "/experimental/tool",
      ...options,
      ...params,
    })
  }

  /**
   * 列出工具 ID
   *
   * 获取所有可用工具 ID，包括内置工具和动态注册的工具。
   */
  public ids<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ToolIdsResponses, ToolIdsErrors, ThrowOnError>({
      url: "/experimental/tool/ids",
      ...options,
      ...params,
    })
  }
}

export class Worktree extends HeyApiClient {
  /**
   * 移除工作树
   *
   * 移除 Git 工作树并删除其分支。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      worktreeRemoveInput?: WorktreeRemoveInput
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeRemoveInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<WorktreeRemoveResponses, WorktreeRemoveErrors, ThrowOnError>({
      url: "/experimental/worktree",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 列出工作树
   *
   * 列出当前项目的所有沙箱工作树。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<WorktreeListResponses, WorktreeListErrors, ThrowOnError>({
      url: "/experimental/worktree",
      ...options,
      ...params,
    })
  }

  /**
   * 创建工作树
   *
   * 为当前项目创建新的 Git 工作树并运行配置的启动脚本。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      worktreeCreateInput?: WorktreeCreateInput
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeCreateInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<WorktreeCreateResponses, WorktreeCreateErrors, ThrowOnError>({
      url: "/experimental/worktree",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 重置工作树
   *
   * 将工作树分支重置到主默认分支。
   */
  public reset<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      worktreeResetInput?: WorktreeResetInput
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeResetInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<WorktreeResetResponses, WorktreeResetErrors, ThrowOnError>({
      url: "/experimental/worktree/reset",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Find extends HeyApiClient {
  /**
   * 查找文本
   *
   * 使用 ripgrep 搜索项目文件中的文本模式。
   */
  public text<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      pattern: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "pattern" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FindTextResponses, FindTextErrors, ThrowOnError>({
      url: "/find",
      ...options,
      ...params,
    })
  }

  /**
   * 查找文件
   *
   * 按名称或模式搜索项目目录中的文件或目录。
   */
  public files<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      query: string
      dirs?: "true" | "false"
      type?: "file" | "directory"
      limit?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "query" },
            { in: "query", key: "dirs" },
            { in: "query", key: "type" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FindFilesResponses, FindFilesErrors, ThrowOnError>({
      url: "/find/file",
      ...options,
      ...params,
    })
  }

  /**
   * 查找符号
   *
   * 使用 LSP 搜索函数、类和变量等工作区符号。
   */
  public symbols<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      query: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "query" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FindSymbolsResponses, FindSymbolsErrors, ThrowOnError>({
      url: "/find/symbol",
      ...options,
      ...params,
    })
  }
}

export class File extends HeyApiClient {
  /**
   * 列出文件
   *
   * 列出指定路径中的文件和目录。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      path: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FileListResponses, FileListErrors, ThrowOnError>({
      url: "/file",
      ...options,
      ...params,
    })
  }

  /**
   * 读取文件
   *
   * 读取指定文件的内容。
   */
  public read<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      path: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FileReadResponses, FileReadErrors, ThrowOnError>({
      url: "/file/content",
      ...options,
      ...params,
    })
  }

  /**
   * 获取文件状态
   *
   * 获取项目中所有文件的 Git 状态。
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FileStatusResponses, FileStatusErrors, ThrowOnError>({
      url: "/file/status",
      ...options,
      ...params,
    })
  }
}

export class Instance extends HeyApiClient {
  /**
   * 释放实例
   *
   * 清理并释放当前 MiaopanCode 实例，释放所有资源。
   */
  public dispose<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<InstanceDisposeResponses, InstanceDisposeErrors, ThrowOnError>({
      url: "/instance/dispose",
      ...options,
      ...params,
    })
  }
}

export class Path extends HeyApiClient {
  /**
   * 获取路径
   *
   * 获取 MiaopanCode 实例的当前工作目录及相关路径信息。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PathGetResponses, PathGetErrors, ThrowOnError>({
      url: "/path",
      ...options,
      ...params,
    })
  }
}

export class Diff extends HeyApiClient {
  /**
   * 获取原始版本控制差异
   *
   * 获取当前未提交更改的原始补丁。
   */
  public raw<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsDiffRawResponses, VcsDiffRawErrors, ThrowOnError>({
      url: "/vcs/diff/raw",
      ...options,
      ...params,
    })
  }
}

export class Vcs extends HeyApiClient {
  /**
   * 获取版本控制信息
   *
   * 获取当前项目的版本控制系统（VCS）信息，例如 Git 分支。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsGetResponses, VcsGetErrors, ThrowOnError>({
      url: "/vcs",
      ...options,
      ...params,
    })
  }

  /**
   * 获取版本控制状态
   *
   * 获取当前工作树中未包含补丁的已更改文件。
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsStatusResponses, VcsStatusErrors, ThrowOnError>({
      url: "/vcs/status",
      ...options,
      ...params,
    })
  }

  /**
   * 获取版本控制差异
   *
   * 获取当前工作树的 Git 差异，或与默认分支的差异。
   */
  public diff<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      mode: "git" | "branch"
      context?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "mode" },
            { in: "query", key: "context" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsDiffResponses, VcsDiffErrors, ThrowOnError>({
      url: "/vcs/diff",
      ...options,
      ...params,
    })
  }

  /**
   * 应用版本控制补丁
   *
   * 将原始补丁应用到当前工作树。
   */
  public apply<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      patch?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "patch" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<VcsApplyResponses, VcsApplyErrors, ThrowOnError>({
      url: "/vcs/apply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _diff?: Diff
  get diff2(): Diff {
    return (this._diff ??= new Diff({ client: this.client }))
  }
}

export class Command extends HeyApiClient {
  /**
   * 列出命令
   *
   * 获取 MiaopanCode 系统中的所有可用命令。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<CommandListResponses, CommandListErrors, ThrowOnError>({
      url: "/command",
      ...options,
      ...params,
    })
  }
}

export class Lsp extends HeyApiClient {
  /**
   * 获取 LSP 状态
   *
   * 获取 LSP 状态
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<LspStatusResponses, LspStatusErrors, ThrowOnError>({
      url: "/lsp",
      ...options,
      ...params,
    })
  }
}

export class Formatter extends HeyApiClient {
  /**
   * 获取格式化程序状态
   *
   * 获取格式化程序状态
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FormatterStatusResponses, FormatterStatusErrors, ThrowOnError>({
      url: "/formatter",
      ...options,
      ...params,
    })
  }
}

export class Auth2 extends HeyApiClient {
  /**
   * 移除 MCP OAuth
   *
   * 移除 MCP 服务器的 OAuth 凭据。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<McpAuthRemoveResponses, McpAuthRemoveErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
      ...params,
    })
  }

  /**
   * 开始 MCP OAuth
   *
   * 开始 MCP 服务器的 OAuth 身份验证流程。
   */
  public start<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAuthStartResponses, McpAuthStartErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
      ...params,
    })
  }

  /**
   * 开始 MCP OAuth
   *
   * 使用授权码完成 Model Context Protocol（MCP）服务器的 OAuth 身份验证。
   */
  public callback<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
      code?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAuthCallbackResponses, McpAuthCallbackErrors, ThrowOnError>({
      url: "/mcp/{name}/auth/callback",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 验证 MCP OAuth
   *
   * 开始 OAuth 流程并等待回调（会打开浏览器）。
   */
  public authenticate<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAuthAuthenticateResponses, McpAuthAuthenticateErrors, ThrowOnError>(
      {
        url: "/mcp/{name}/auth/authenticate",
        ...options,
        ...params,
      },
    )
  }
}

export class Mcp extends HeyApiClient {
  /**
   * 获取 MCP 状态
   *
   * 获取所有 Model Context Protocol（MCP）服务器的状态。
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<McpStatusResponses, McpStatusErrors, ThrowOnError>({
      url: "/mcp",
      ...options,
      ...params,
    })
  }

  /**
   * 添加 MCP 服务器
   *
   * 动态向系统添加新的 Model Context Protocol（MCP）服务器。
   */
  public add<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      name?: string
      config?: McpLocalConfig | McpRemoteConfig
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "name" },
            { in: "body", key: "config" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAddResponses, McpAddErrors, ThrowOnError>({
      url: "/mcp",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 连接 MCP 服务器
   */
  public connect<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpConnectResponses, McpConnectErrors, ThrowOnError>({
      url: "/mcp/{name}/connect",
      ...options,
      ...params,
    })
  }

  /**
   * 断开 MCP 服务器
   */
  public disconnect<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpDisconnectResponses, McpDisconnectErrors, ThrowOnError>({
      url: "/mcp/{name}/disconnect",
      ...options,
      ...params,
    })
  }

  private _auth?: Auth2
  get auth(): Auth2 {
    return (this._auth ??= new Auth2({ client: this.client }))
  }
}

export class Project extends HeyApiClient {
  /**
   * 列出所有项目
   *
   * 获取已使用 MiaopanCode 打开的项目列表。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProjectListResponses, ProjectListErrors, ThrowOnError>({
      url: "/project",
      ...options,
      ...params,
    })
  }

  /**
   * 获取当前项目
   *
   * 获取 MiaopanCode 当前正在使用的活动项目。
   */
  public current<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProjectCurrentResponses, ProjectCurrentErrors, ThrowOnError>({
      url: "/project/current",
      ...options,
      ...params,
    })
  }

  /**
   * 初始化 Git 仓库
   *
   * 为当前项目创建 Git 仓库并返回刷新后的项目信息。
   */
  public initGit<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<ProjectInitGitResponses, ProjectInitGitErrors, ThrowOnError>({
      url: "/project/git/init",
      ...options,
      ...params,
    })
  }

  /**
   * 更新项目
   *
   * 更新项目属性，例如名称、图标和命令。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      directory?: string
      workspace?: string
      name?: string
      icon?: ProjectIcon
      commands?: ProjectCommands
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "name" },
            { in: "body", key: "icon" },
            { in: "body", key: "commands" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<ProjectUpdateResponses, ProjectUpdateErrors, ThrowOnError>({
      url: "/project/{projectID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 列出项目目录
   *
   * 列出项目已知的本地绝对目录。
   */
  public directories<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProjectDirectoriesResponses, ProjectDirectoriesErrors, ThrowOnError>({
      url: "/project/{projectID}/directories",
      ...options,
      ...params,
    })
  }
}

export class Pty extends HeyApiClient {
  /**
   * 列出可用 shell
   *
   * 获取系统上的可用 shell 列表。
   */
  public shells<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyShellsResponses, PtyShellsErrors, ThrowOnError>({
      url: "/pty/shells",
      ...options,
      ...params,
    })
  }

  /**
   * 列出 PTY 会话
   *
   * 获取 MiaopanCode 管理的所有活动伪终端（PTY）会话。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyListResponses, PtyListErrors, ThrowOnError>({
      url: "/pty",
      ...options,
      ...params,
    })
  }

  /**
   * 创建 PTY 会话
   *
   * 创建用于运行 shell 命令和进程的新伪终端（PTY）会话。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      command?: string
      args?: Array<string>
      cwd?: string
      title?: string
      env?: {
        [key: string]: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "command" },
            { in: "body", key: "args" },
            { in: "body", key: "cwd" },
            { in: "body", key: "title" },
            { in: "body", key: "env" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PtyCreateResponses, PtyCreateErrors, ThrowOnError>({
      url: "/pty",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 移除 PTY 会话
   *
   * 移除并终止指定伪终端（PTY）会话。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<PtyRemoveResponses, PtyRemoveErrors, ThrowOnError>({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
    })
  }

  /**
   * 获取 PTY 会话
   *
   * 获取特定伪终端（PTY）会话的详细信息。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyGetResponses, PtyGetErrors, ThrowOnError>({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
    })
  }

  /**
   * 更新 PTY 会话
   *
   * 更新现有伪终端（PTY）会话的属性。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
      title?: string
      size?: {
        rows: number
        cols: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "size" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put<PtyUpdateResponses, PtyUpdateErrors, ThrowOnError>({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 创建 PTY WebSocket 令牌
   *
   * 创建用于打开 PTY WebSocket 连接的短期令牌。
   */
  public connectToken<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PtyConnectTokenResponses, PtyConnectTokenErrors, ThrowOnError>({
      url: "/pty/{ptyID}/connect-token",
      ...options,
      ...params,
    })
  }

  /**
   * 连接 PTY 会话
   *
   * 建立 WebSocket 连接，以实时与伪终端（PTY）会话交互。
   */
  public connect<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
      cursor?: string
      ticket?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "cursor" },
            { in: "query", key: "ticket" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyConnectResponses, PtyConnectErrors, ThrowOnError>({
      url: "/pty/{ptyID}/connect",
      ...options,
      ...params,
    })
  }
}

export class Question extends HeyApiClient {
  /**
   * 列出待处理问题请求
   *
   * 获取位置的待处理问题请求。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<QuestionListResponses, QuestionListErrors, ThrowOnError>({
      url: "/question",
      ...options,
      ...params,
    })
  }

  /**
   * 回复待处理问题请求
   *
   * 回答会话拥有的待处理问题请求。
   */
  public reply<ThrowOnError extends boolean = false>(
    parameters: {
      requestID: string
      directory?: string
      workspace?: string
      answers?: Array<QuestionAnswer>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "answers" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<QuestionReplyResponses, QuestionReplyErrors, ThrowOnError>({
      url: "/question/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 拒绝待处理问题请求
   *
   * 拒绝会话拥有的待处理问题请求。
   */
  public reject<ThrowOnError extends boolean = false>(
    parameters: {
      requestID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<QuestionRejectResponses, QuestionRejectErrors, ThrowOnError>({
      url: "/question/{requestID}/reject",
      ...options,
      ...params,
    })
  }
}

export class Permission extends HeyApiClient {
  /**
   * 列出待处理权限
   *
   * 获取所有会话中的待处理权限请求。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PermissionListResponses, PermissionListErrors, ThrowOnError>({
      url: "/permission",
      ...options,
      ...params,
    })
  }

  /**
   * 响应权限请求
   *
   * 批准或拒绝 AI 助手发起的权限请求。
   */
  public reply<ThrowOnError extends boolean = false>(
    parameters: {
      requestID: string
      directory?: string
      workspace?: string
      reply?: "once" | "always" | "reject"
      message?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "reply" },
            { in: "body", key: "message" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PermissionReplyResponses, PermissionReplyErrors, ThrowOnError>({
      url: "/permission/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 响应权限请求
   *
   * 批准或拒绝 AI 助手发起的权限请求。
   *
   * @deprecated
   */
  public respond<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      permissionID: string
      directory?: string
      workspace?: string
      response?: "once" | "always" | "reject"
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "permissionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "response" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PermissionRespondResponses, PermissionRespondErrors, ThrowOnError>({
      url: "/session/{sessionID}/permissions/{permissionID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Oauth extends HeyApiClient {
  /**
   * 开始 OAuth 授权
   *
   * 为提供商开始 OAuth 授权流程。
   */
  public authorize<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      directory?: string
      workspace?: string
      method?: number
      inputs?: {
        [key: string]: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "method" },
            { in: "body", key: "inputs" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ProviderOauthAuthorizeResponses,
      ProviderOauthAuthorizeErrors,
      ThrowOnError
    >({
      url: "/provider/{providerID}/oauth/authorize",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 处理 OAuth 回调
   *
   * 处理用户授权后提供商发出的 OAuth 回调。
   */
  public callback<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      directory?: string
      workspace?: string
      method?: number
      code?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "method" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ProviderOauthCallbackResponses,
      ProviderOauthCallbackErrors,
      ThrowOnError
    >({
      url: "/provider/{providerID}/oauth/callback",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Provider extends HeyApiClient {
  /**
   * 列出提供商
   *
   * 获取所有可用 AI 提供商，包括可用和已连接的提供商。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProviderListResponses, ProviderListErrors, ThrowOnError>({
      url: "/provider",
      ...options,
      ...params,
    })
  }

  /**
   * 获取提供商身份验证方式
   *
   * 获取所有 AI 提供商可用的身份验证方式。
   */
  public auth<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProviderAuthResponses, ProviderAuthErrors, ThrowOnError>({
      url: "/provider/auth",
      ...options,
      ...params,
    })
  }

  private _oauth?: Oauth
  get oauth(): Oauth {
    return (this._oauth ??= new Oauth({ client: this.client }))
  }
}

export class Session2 extends HeyApiClient {
  /**
   * 列出会话
   *
   * 按请求顺序获取会话。各页保持该顺序；使用 cursor.next 或 cursor.previous 浏览有序列表。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      scope?: "project"
      path?: string
      roots?: boolean | "true" | "false"
      start?: number
      search?: string
      limit?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "scope" },
            { in: "query", key: "path" },
            { in: "query", key: "roots" },
            { in: "query", key: "start" },
            { in: "query", key: "search" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionListResponses, SessionListErrors, ThrowOnError>({
      url: "/session",
      ...options,
      ...params,
    })
  }

  /**
   * 创建会话
   *
   * 在请求的位置创建会话。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      parentID?: string
      title?: string
      agent?: string
      model?: {
        id: string
        providerID: string
        variant?: string
      }
      metadata?: {
        [key: string]: unknown
      }
      permission?: PermissionRuleset
      workspaceID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "parentID" },
            { in: "body", key: "title" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "metadata" },
            { in: "body", key: "permission" },
            { in: "body", key: "workspaceID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionCreateResponses, SessionCreateErrors, ThrowOnError>({
      url: "/session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 获取会话状态
   *
   * 获取所有会话的当前状态，包括活动、空闲和已完成状态。
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionStatusResponses, SessionStatusErrors, ThrowOnError>({
      url: "/session/status",
      ...options,
      ...params,
    })
  }

  /**
   * 删除会话
   *
   * 删除会话及其所有关联数据，包括消息和历史记录。
   */
  public delete<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<SessionDeleteResponses, SessionDeleteErrors, ThrowOnError>({
      url: "/session/{sessionID}",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话
   *
   * 按 ID 获取会话。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionGetResponses, SessionGetErrors, ThrowOnError>({
      url: "/session/{sessionID}",
      ...options,
      ...params,
    })
  }

  /**
   * 更新会话
   *
   * 更新会话属性，例如标题或其他元数据。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      title?: string
      metadata?: {
        [key: string]: unknown
      }
      permission?: PermissionRuleset
      time?: {
        archived?: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "metadata" },
            { in: "body", key: "permission" },
            { in: "body", key: "time" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<SessionUpdateResponses, SessionUpdateErrors, ThrowOnError>({
      url: "/session/{sessionID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 获取会话子项
   *
   * 获取从指定父会话分叉的所有子会话。
   */
  public children<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionChildrenResponses, SessionChildrenErrors, ThrowOnError>({
      url: "/session/{sessionID}/children",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话任务
   *
   * 获取特定会话关联的任务列表。
   */
  public todo<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionTodoResponses, SessionTodoErrors, ThrowOnError>({
      url: "/session/{sessionID}/todo",
      ...options,
      ...params,
    })
  }

  /**
   * 获取消息差异
   *
   * 获取会话中特定用户消息产生的文件更改。
   */
  public diff<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionDiffResponses, SessionDiffErrors, ThrowOnError>({
      url: "/session/{sessionID}/diff",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话消息
   *
   * 获取会话中的所有消息，包括用户提示和 AI 回复。
   */
  public messages<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      limit?: number
      before?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "limit" },
            { in: "query", key: "before" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionMessagesResponses, SessionMessagesErrors, ThrowOnError>({
      url: "/session/{sessionID}/message",
      ...options,
      ...params,
    })
  }

  /**
   * 发送消息
   *
   * 持久化接收一条会话输入，并在 resume 不为 false 时排程代理循环执行。
   */
  public prompt<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      model?: {
        providerID: string
        modelID: string
      }
      agent?: string
      noReply?: boolean
      tools?: {
        [key: string]: boolean
      }
      format?: OutputFormat
      system?: string
      variant?: string
      oai?: boolean
      parts?: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "model" },
            { in: "body", key: "agent" },
            { in: "body", key: "noReply" },
            { in: "body", key: "tools" },
            { in: "body", key: "format" },
            { in: "body", key: "system" },
            { in: "body", key: "variant" },
            { in: "body", key: "oai" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionPromptResponses, SessionPromptErrors, ThrowOnError>({
      url: "/session/{sessionID}/message",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 删除消息
   *
   * 从会话中永久删除指定消息及其所有部分，但不还原文件更改。
   */
  public deleteMessage<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<
      SessionDeleteMessageResponses,
      SessionDeleteMessageErrors,
      ThrowOnError
    >({
      url: "/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }

  /**
   * 获取消息
   *
   * 按消息 ID 获取特定消息。
   */
  public message<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionMessageResponses, SessionMessageErrors, ThrowOnError>({
      url: "/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }

  /**
   * 分叉会话
   *
   * 在特定消息位置分叉现有会话以创建新会话。
   */
  public fork<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionForkResponses, SessionForkErrors, ThrowOnError>({
      url: "/session/{sessionID}/fork",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 中止会话
   *
   * 中止活动会话并停止正在进行的 AI 处理或命令执行。
   */
  public abort<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionAbortResponses, SessionAbortErrors, ThrowOnError>({
      url: "/session/{sessionID}/abort",
      ...options,
      ...params,
    })
  }

  /**
   * 初始化会话
   *
   * 初始化会话
   */
  public init<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      modelID?: string
      providerID?: string
      messageID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "modelID" },
            { in: "body", key: "providerID" },
            { in: "body", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionInitResponses, SessionInitErrors, ThrowOnError>({
      url: "/session/{sessionID}/init",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 取消分享会话
   *
   * 移除会话分享链接，使其重新变为私有。
   */
  public unshare<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<SessionUnshareResponses, SessionUnshareErrors, ThrowOnError>({
      url: "/session/{sessionID}/share",
      ...options,
      ...params,
    })
  }

  /**
   * 分享会话
   *
   * 创建会话分享链接，让其他人查看对话。
   */
  public share<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionShareResponses, SessionShareErrors, ThrowOnError>({
      url: "/session/{sessionID}/share",
      ...options,
      ...params,
    })
  }

  /**
   * 总结会话
   *
   * 使用 AI 压缩生成会话简要总结，以保留关键信息。
   */
  public summarize<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      providerID?: string
      modelID?: string
      auto?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "providerID" },
            { in: "body", key: "modelID" },
            { in: "body", key: "auto" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionSummarizeResponses, SessionSummarizeErrors, ThrowOnError>({
      url: "/session/{sessionID}/summarize",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 异步发送消息
   *
   * 持久化接收一条会话输入，并在 resume 不为 false 时排程代理循环执行。
   */
  public promptAsync<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      model?: {
        providerID: string
        modelID: string
      }
      agent?: string
      noReply?: boolean
      tools?: {
        [key: string]: boolean
      }
      format?: OutputFormat
      system?: string
      variant?: string
      oai?: boolean
      parts?: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "model" },
            { in: "body", key: "agent" },
            { in: "body", key: "noReply" },
            { in: "body", key: "tools" },
            { in: "body", key: "format" },
            { in: "body", key: "system" },
            { in: "body", key: "variant" },
            { in: "body", key: "oai" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionPromptAsyncResponses, SessionPromptAsyncErrors, ThrowOnError>({
      url: "/session/{sessionID}/prompt_async",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 继续当前任务
   *
   * 不添加新提示词，直接从现有会话历史继续执行。
   */
  public continue<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      model?: {
        providerID: string
        modelID: string
      }
      variant?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "model" },
            { in: "body", key: "variant" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionContinueResponses, SessionContinueErrors, ThrowOnError>({
      url: "/session/{sessionID}/continue",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 发送命令
   *
   * 向会话发送新命令，由 AI 助手执行。
   */
  public command<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      agent?: string
      model?: string
      arguments?: string
      command?: string
      variant?: string
      oai?: boolean
      parts?: Array<{
        id?: string
        type: "file"
        mime: string
        filename?: string
        url: string
        source?: FilePartSource
      }>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "arguments" },
            { in: "body", key: "command" },
            { in: "body", key: "variant" },
            { in: "body", key: "oai" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionCommandResponses, SessionCommandErrors, ThrowOnError>({
      url: "/session/{sessionID}/command",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 运行 shell 命令
   *
   * 在会话上下文中执行 shell 命令并返回 AI 响应。
   */
  public shell<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      agent?: string
      model?: {
        providerID: string
        modelID: string
      }
      command?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "command" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionShellResponses, SessionShellErrors, ThrowOnError>({
      url: "/session/{sessionID}/shell",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 还原消息
   *
   * 还原会话中的特定消息，撤销其影响并恢复之前状态；将 revertFiles 设为 false 可保留文件改动。
   */
  public revert<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      partID?: string
      revertFiles?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "partID" },
            { in: "body", key: "revertFiles" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionRevertResponses, SessionRevertErrors, ThrowOnError>({
      url: "/session/{sessionID}/revert",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 恢复还原的消息
   *
   * 恢复会话中之前还原的所有消息。
   */
  public unrevert<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionUnrevertResponses, SessionUnrevertErrors, ThrowOnError>({
      url: "/session/{sessionID}/unrevert",
      ...options,
      ...params,
    })
  }
}

export class Part extends HeyApiClient {
  /**
   * 删除消息部分
   *
   * 删除消息部分
   */
  public delete<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      partID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "path", key: "partID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<PartDeleteResponses, PartDeleteErrors, ThrowOnError>({
      url: "/session/{sessionID}/message/{messageID}/part/{partID}",
      ...options,
      ...params,
    })
  }

  /**
   * 更新消息部分
   *
   * 更新消息部分
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      partID: string
      directory?: string
      workspace?: string
      part?: Part2
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "path", key: "partID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "part", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<PartUpdateResponses, PartUpdateErrors, ThrowOnError>({
      url: "/session/{sessionID}/message/{messageID}/part/{partID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class History extends HeyApiClient {
  /**
   * 列出同步事件
   *
   * 列出同步事件
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      body?: {
        [key: string]: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncHistoryListResponses, SyncHistoryListErrors, ThrowOnError>({
      url: "/sync/history",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Sync extends HeyApiClient {
  /**
   * 启动工作区同步
   *
   * 为当前项目中有活动会话的工作区启动同步循环。
   */
  public start<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncStartResponses, SyncStartErrors, ThrowOnError>({
      url: "/sync/start",
      ...options,
      ...params,
    })
  }

  /**
   * 重放同步事件
   *
   * 验证并重放完整的同步事件历史。
   */
  public replay<ThrowOnError extends boolean = false>(
    parameters?: {
      query_directory?: string
      workspace?: string
      body_directory?: string
      events?: Array<{
        id: string
        aggregateID: string
        seq: number
        type: string
        data: {
          [key: string]: unknown
        }
      }>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            {
              in: "query",
              key: "query_directory",
              map: "directory",
            },
            { in: "query", key: "workspace" },
            {
              in: "body",
              key: "body_directory",
              map: "directory",
            },
            { in: "body", key: "events" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncReplayResponses, SyncReplayErrors, ThrowOnError>({
      url: "/sync/replay",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 将会话转移到工作区
   *
   * 通过同步事件系统更新会话，使其归属于当前工作区。
   */
  public steal<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      sessionID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "sessionID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncStealResponses, SyncStealErrors, ThrowOnError>({
      url: "/sync/steal",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _history?: History
  get history(): History {
    return (this._history ??= new History({ client: this.client }))
  }
}

export class Control extends HeyApiClient {
  /**
   * 获取下一个 TUI 请求
   *
   * 获取下一个 TUI 请求
   */
  public next<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<TuiControlNextResponses, TuiControlNextErrors, ThrowOnError>({
      url: "/tui/control/next",
      ...options,
      ...params,
    })
  }

  /**
   * 提交 TUI 响应
   *
   * 提交 TUI 响应
   */
  public response<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      body?: unknown
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiControlResponseResponses, TuiControlResponseErrors, ThrowOnError>({
      url: "/tui/control/response",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Tui extends HeyApiClient {
  /**
   * 追加 TUI 提示
   *
   * 将提示追加到 TUI。
   */
  public appendPrompt<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      text?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "text" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiAppendPromptResponses, TuiAppendPromptErrors, ThrowOnError>({
      url: "/tui/append-prompt",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 打开帮助对话框
   *
   * 打开帮助对话框
   */
  public openHelp<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenHelpResponses, TuiOpenHelpErrors, ThrowOnError>({
      url: "/tui/open-help",
      ...options,
      ...params,
    })
  }

  /**
   * 打开会话对话框
   *
   * 打开会话对话框
   */
  public openSessions<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenSessionsResponses, TuiOpenSessionsErrors, ThrowOnError>({
      url: "/tui/open-sessions",
      ...options,
      ...params,
    })
  }

  /**
   * 打开主题对话框
   *
   * 打开主题对话框
   */
  public openThemes<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenThemesResponses, TuiOpenThemesErrors, ThrowOnError>({
      url: "/tui/open-themes",
      ...options,
      ...params,
    })
  }

  /**
   * 打开模型对话框
   *
   * 打开模型对话框
   */
  public openModels<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenModelsResponses, TuiOpenModelsErrors, ThrowOnError>({
      url: "/tui/open-models",
      ...options,
      ...params,
    })
  }

  /**
   * 提交 TUI 提示
   *
   * 提交 TUI 提示
   */
  public submitPrompt<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiSubmitPromptResponses, TuiSubmitPromptErrors, ThrowOnError>({
      url: "/tui/submit-prompt",
      ...options,
      ...params,
    })
  }

  /**
   * 清除 TUI 提示
   *
   * 清除 TUI 提示
   */
  public clearPrompt<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiClearPromptResponses, TuiClearPromptErrors, ThrowOnError>({
      url: "/tui/clear-prompt",
      ...options,
      ...params,
    })
  }

  /**
   * 执行 TUI 命令
   *
   * 执行 TUI 命令
   */
  public executeCommand<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      command?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "command" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiExecuteCommandResponses, TuiExecuteCommandErrors, ThrowOnError>({
      url: "/tui/execute-command",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 显示 TUI 通知
   *
   * 显示 TUI 通知
   */
  public showToast<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      title?: string
      message?: string
      variant?: "info" | "success" | "warning" | "error"
      duration?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "message" },
            { in: "body", key: "variant" },
            { in: "body", key: "duration" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiShowToastResponses, TuiShowToastErrors, ThrowOnError>({
      url: "/tui/show-toast",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 发布 TUI 事件
   *
   * 发布 TUI 事件
   */
  public publish<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      body?: EventTuiPromptAppend | EventTuiCommandExecute | EventTuiToastShow | EventTuiSessionSelect
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiPublishResponses, TuiPublishErrors, ThrowOnError>({
      url: "/tui/publish",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 选择会话
   *
   * 选择会话
   */
  public selectSession<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      sessionID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "sessionID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiSelectSessionResponses, TuiSelectSessionErrors, ThrowOnError>({
      url: "/tui/select-session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _control?: Control
  get control(): Control {
    return (this._control ??= new Control({ client: this.client }))
  }
}

export class Health extends HeyApiClient {
  /**
   * 检查服务器健康状态
   *
   * 检查 API 服务器是否已准备好接受请求。
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).get<V2HealthGetResponses, V2HealthGetErrors, ThrowOnError>({
      url: "/api/health",
      ...options,
    })
  }
}

export class Location extends HeyApiClient {
  /**
   * 获取位置
   *
   * 解析请求的位置或服务器默认位置。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2LocationGetResponses, V2LocationGetErrors, ThrowOnError>({
      url: "/api/location",
      ...options,
      ...params,
    })
  }
}

export class Agent extends HeyApiClient {
  /**
   * 列出代理
   *
   * 获取当前已注册的代理。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2AgentListResponses, V2AgentListErrors, ThrowOnError>({
      url: "/api/agent",
      ...options,
      ...params,
    })
  }
}

export class Revert extends HeyApiClient {
  /**
   * 暂存会话还原
   *
   * 暂存或移动可还原的会话边界，并可选地应用其文件更改。
   */
  public stage<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID?: string
      files?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "body", key: "messageID" },
            { in: "body", key: "files" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionRevertStageResponses,
      V2SessionRevertStageErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/revert/stage",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 清除暂存还原
   */
  public clear<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).post<
      V2SessionRevertClearResponses,
      V2SessionRevertClearErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/revert/clear",
      ...options,
      ...params,
    })
  }

  /**
   * 提交暂存还原
   */
  public commit<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).post<
      V2SessionRevertCommitResponses,
      V2SessionRevertCommitErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/revert/commit",
      ...options,
      ...params,
    })
  }
}

export class Permission2 extends HeyApiClient {
  /**
   * 列出会话权限请求
   *
   * 获取会话拥有的待处理权限请求。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).get<
      V2SessionPermissionListResponses,
      V2SessionPermissionListErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/permission",
      ...options,
      ...params,
    })
  }

  /**
   * 创建权限请求
   *
   * 评估权限，并在需要批准时为会话创建权限请求。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      id?: string
      action?: string
      resources?: Array<string>
      save?: Array<string>
      metadata?: {
        [key: string]: unknown
      }
      source?: PermissionV2Source
      agent?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "body", key: "id" },
            { in: "body", key: "action" },
            { in: "body", key: "resources" },
            { in: "body", key: "save" },
            { in: "body", key: "metadata" },
            { in: "body", key: "source" },
            { in: "body", key: "agent" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionPermissionCreateResponses,
      V2SessionPermissionCreateErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/permission",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 获取权限请求
   *
   * 获取会话拥有的待处理权限请求。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      requestID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "requestID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      V2SessionPermissionGetResponses,
      V2SessionPermissionGetErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/permission/{requestID}",
      ...options,
      ...params,
    })
  }

  /**
   * 回复待处理权限请求
   *
   * 回复待处理的权限请求。
   */
  public reply<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      requestID: string
      reply?: PermissionV2Reply
      message?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "requestID" },
            { in: "body", key: "reply" },
            { in: "body", key: "message" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionPermissionReplyResponses,
      V2SessionPermissionReplyErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/permission/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Question2 extends HeyApiClient {
  /**
   * 列出会话问题请求
   *
   * 获取会话拥有的待处理问题请求。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).get<
      V2SessionQuestionListResponses,
      V2SessionQuestionListErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/question",
      ...options,
      ...params,
    })
  }

  /**
   * 回复待处理问题请求
   *
   * 回答会话拥有的待处理问题请求。
   */
  public reply<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      requestID: string
      questionV2Reply: QuestionV2Reply
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "requestID" },
            { key: "questionV2Reply", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionQuestionReplyResponses,
      V2SessionQuestionReplyErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/question/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 拒绝待处理问题请求
   *
   * 拒绝会话拥有的待处理问题请求。
   */
  public reject<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      requestID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "requestID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionQuestionRejectResponses,
      V2SessionQuestionRejectErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/question/{requestID}/reject",
      ...options,
      ...params,
    })
  }
}

export class Session3 extends HeyApiClient {
  /**
   * 列出会话
   *
   * 按请求顺序获取会话。各页保持该顺序；使用 cursor.next 或 cursor.previous 浏览有序列表。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      workspace?: string
      limit?: number
      order?: "asc" | "desc"
      search?: string
      directory?: string
      project?: string
      subpath?: string
      cursor?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "workspace" },
            { in: "query", key: "limit" },
            { in: "query", key: "order" },
            { in: "query", key: "search" },
            { in: "query", key: "directory" },
            { in: "query", key: "project" },
            { in: "query", key: "subpath" },
            { in: "query", key: "cursor" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionListResponses, V2SessionListErrors, ThrowOnError>({
      url: "/api/session",
      ...options,
      ...params,
    })
  }

  /**
   * 创建会话
   *
   * 在请求的位置创建会话。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      id?: string
      agent?: string
      model?: ModelRef
      location?: LocationRef
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "body", key: "id" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2SessionCreateResponses, V2SessionCreateErrors, ThrowOnError>({
      url: "/api/session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 列出活动会话
   *
   * 获取当前由此 miaopanCode 进程拥有的前台会话排程。不在结果中的会话均处于非活动状态。
   */
  public active<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).get<V2SessionActiveResponses, V2SessionActiveErrors, ThrowOnError>({
      url: "/api/session/active",
      ...options,
    })
  }

  /**
   * 获取会话
   *
   * 按 ID 获取会话。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).get<V2SessionGetResponses, V2SessionGetErrors, ThrowOnError>({
      url: "/api/session/{sessionID}",
      ...options,
      ...params,
    })
  }

  /**
   * 切换会话代理
   *
   * 切换后续提供商轮次使用的代理。
   */
  public switchAgent<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      agent?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "body", key: "agent" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionSwitchAgentResponses,
      V2SessionSwitchAgentErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/agent",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 切换会话模型
   *
   * 切换后续提供商轮次使用的模型。
   */
  public switchModel<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      model?: ModelRef
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "body", key: "model" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2SessionSwitchModelResponses,
      V2SessionSwitchModelErrors,
      ThrowOnError
    >({
      url: "/api/session/{sessionID}/model",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 发送消息
   *
   * 持久化接收一条会话输入，并在 resume 不为 false 时排程代理循环执行。
   */
  public prompt<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      id?: string
      prompt?: PromptInput
      delivery?: "steer" | "queue"
      resume?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "body", key: "id" },
            { in: "body", key: "prompt" },
            { in: "body", key: "delivery" },
            { in: "body", key: "resume" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2SessionPromptResponses, V2SessionPromptErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/prompt",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 压缩会话
   *
   * 压缩会话对话。
   */
  public compact<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).post<V2SessionCompactResponses, V2SessionCompactErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/compact",
      ...options,
      ...params,
    })
  }

  /**
   * 等待会话
   *
   * 等待会话代理循环变为空闲。
   */
  public wait<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).post<V2SessionWaitResponses, V2SessionWaitErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/wait",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话上下文
   *
   * 获取会话的活动上下文消息（最后一次压缩之后的所有消息）。
   */
  public context<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).get<V2SessionContextResponses, V2SessionContextErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/context",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话历史
   *
   * 读取独占聚合序列之后的一页有限公共持久化会话事件。新提交的事件可能出现在后续页面。
   */
  public history<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      limit?: number
      after?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "limit" },
            { in: "query", key: "after" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionHistoryResponses, V2SessionHistoryErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/history",
      ...options,
      ...params,
    })
  }

  /**
   * 订阅会话事件
   *
   * 重放指定聚合序列之后的持久化事件，然后继续接收新的持久化事件。
   */
  public events<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      after?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "after" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).sse.get<V2SessionEventsResponses, V2SessionEventsErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/event",
      ...options,
      ...params,
    })
  }

  /**
   * 中断会话执行
   *
   * 中断由此 miaopanCode 进程拥有的活动执行。空闲中断不执行任何操作。
   */
  public interrupt<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "sessionID" }] }])
    return (options?.client ?? this.client).post<V2SessionInterruptResponses, V2SessionInterruptErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/interrupt",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话消息
   *
   * 获取由会话拥有的单条投影消息。
   */
  public message<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionMessageResponses, V2SessionMessageErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }

  /**
   * 获取会话消息
   *
   * 获取会话的投影消息。各页保持请求的顺序；使用 cursor.next 或 cursor.previous 浏览有序时间线。
   */
  public messages<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      limit?: number
      order?: "asc" | "desc"
      cursor?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "limit" },
            { in: "query", key: "order" },
            { in: "query", key: "cursor" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionMessagesResponses, V2SessionMessagesErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/message",
      ...options,
      ...params,
    })
  }

  private _revert?: Revert
  get revert(): Revert {
    return (this._revert ??= new Revert({ client: this.client }))
  }

  private _permission?: Permission2
  get permission(): Permission2 {
    return (this._permission ??= new Permission2({ client: this.client }))
  }

  private _question?: Question2
  get question(): Question2 {
    return (this._question ??= new Question2({ client: this.client }))
  }
}

export class Model extends HeyApiClient {
  /**
   * 列出模型
   *
   * 按发布日期排序获取可用模型。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2ModelListResponses, V2ModelListErrors, ThrowOnError>({
      url: "/api/model",
      ...options,
      ...params,
    })
  }
}

export class Provider2 extends HeyApiClient {
  /**
   * 列出提供商
   *
   * 获取活动 AI 提供商，使客户端可以显示提供商可用性和配置。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2ProviderListResponses, V2ProviderListErrors, ThrowOnError>({
      url: "/api/provider",
      ...options,
      ...params,
    })
  }

  /**
   * 获取提供商
   *
   * 获取单个 AI 提供商，使客户端可以检查其可用性和端点设置。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2ProviderGetResponses, V2ProviderGetErrors, ThrowOnError>({
      url: "/api/provider/{providerID}",
      ...options,
      ...params,
    })
  }
}

export class Connect extends HeyApiClient {
  /**
   * 使用密钥连接
   *
   * 运行密钥身份验证方式并保存生成的凭据。
   */
  public key<ThrowOnError extends boolean = false>(
    parameters: {
      integrationID: string
      location?: {
        directory?: string
        workspace?: string
      }
      key?: string
      label?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "integrationID" },
            { in: "query", key: "location" },
            { in: "body", key: "key" },
            { in: "body", key: "label" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2IntegrationConnectKeyResponses,
      V2IntegrationConnectKeyErrors,
      ThrowOnError
    >({
      url: "/api/integration/{integrationID}/connect/key",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 开始 OAuth 连接
   *
   * 开始 OAuth 尝试并返回授权详情。
   */
  public oauth<ThrowOnError extends boolean = false>(
    parameters: {
      integrationID: string
      location?: {
        directory?: string
        workspace?: string
      }
      methodID?: string
      inputs?: {
        [key: string]: string
      }
      label?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "integrationID" },
            { in: "query", key: "location" },
            { in: "body", key: "methodID" },
            { in: "body", key: "inputs" },
            { in: "body", key: "label" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2IntegrationConnectOauthResponses,
      V2IntegrationConnectOauthErrors,
      ThrowOnError
    >({
      url: "/api/integration/{integrationID}/connect/oauth",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Attempt extends HeyApiClient {
  /**
   * 取消 OAuth 连接
   *
   * 取消 OAuth 尝试并释放其资源。
   */
  public cancel<ThrowOnError extends boolean = false>(
    parameters: {
      attemptID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "attemptID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<
      V2IntegrationAttemptCancelResponses,
      V2IntegrationAttemptCancelErrors,
      ThrowOnError
    >({
      url: "/api/integration/attempt/{attemptID}",
      ...options,
      ...params,
    })
  }

  /**
   * 获取 OAuth 尝试状态
   *
   * 轮询 OAuth 尝试的当前状态。
   */
  public status<ThrowOnError extends boolean = false>(
    parameters: {
      attemptID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "attemptID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      V2IntegrationAttemptStatusResponses,
      V2IntegrationAttemptStatusErrors,
      ThrowOnError
    >({
      url: "/api/integration/attempt/{attemptID}",
      ...options,
      ...params,
    })
  }

  /**
   * 完成 OAuth 连接
   *
   * 完成基于代码的 OAuth 尝试并保存生成的凭据。
   */
  public complete<ThrowOnError extends boolean = false>(
    parameters: {
      attemptID: string
      location?: {
        directory?: string
        workspace?: string
      }
      code?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "attemptID" },
            { in: "query", key: "location" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2IntegrationAttemptCompleteResponses,
      V2IntegrationAttemptCompleteErrors,
      ThrowOnError
    >({
      url: "/api/integration/attempt/{attemptID}/complete",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Integration extends HeyApiClient {
  /**
   * 列出集成
   *
   * 获取可用集成及其身份验证方式。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2IntegrationListResponses, V2IntegrationListErrors, ThrowOnError>({
      url: "/api/integration",
      ...options,
      ...params,
    })
  }

  /**
   * 获取集成
   *
   * 获取单个集成及其身份验证方式。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      integrationID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "integrationID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2IntegrationGetResponses, V2IntegrationGetErrors, ThrowOnError>({
      url: "/api/integration/{integrationID}",
      ...options,
      ...params,
    })
  }

  private _connect?: Connect
  get connect(): Connect {
    return (this._connect ??= new Connect({ client: this.client }))
  }

  private _attempt?: Attempt
  get attempt(): Attempt {
    return (this._attempt ??= new Attempt({ client: this.client }))
  }
}

export class Credential extends HeyApiClient {
  /**
   * 移除凭据
   *
   * 移除已存储的集成凭据。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      credentialID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "credentialID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<V2CredentialRemoveResponses, V2CredentialRemoveErrors, ThrowOnError>(
      {
        url: "/api/credential/{credentialID}",
        ...options,
        ...params,
      },
    )
  }

  /**
   * 更新凭据
   *
   * 更新已存储的凭据标签。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      credentialID: string
      location?: {
        directory?: string
        workspace?: string
      }
      label?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "credentialID" },
            { in: "query", key: "location" },
            { in: "body", key: "label" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<V2CredentialUpdateResponses, V2CredentialUpdateErrors, ThrowOnError>({
      url: "/api/credential/{credentialID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Request extends HeyApiClient {
  /**
   * 列出待处理权限请求
   *
   * 获取位置的待处理权限请求。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<
      V2PermissionRequestListResponses,
      V2PermissionRequestListErrors,
      ThrowOnError
    >({
      url: "/api/permission/request",
      ...options,
      ...params,
    })
  }
}

export class Saved extends HeyApiClient {
  /**
   * 列出已保存权限
   *
   * 获取已保存的权限，可按项目筛选。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      projectID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "projectID" }] }])
    return (options?.client ?? this.client).get<
      V2PermissionSavedListResponses,
      V2PermissionSavedListErrors,
      ThrowOnError
    >({
      url: "/api/permission/saved",
      ...options,
      ...params,
    })
  }

  /**
   * 移除已保存权限
   *
   * 按 ID 移除已保存的权限。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      id: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "id" }] }])
    return (options?.client ?? this.client).delete<
      V2PermissionSavedRemoveResponses,
      V2PermissionSavedRemoveErrors,
      ThrowOnError
    >({
      url: "/api/permission/saved/{id}",
      ...options,
      ...params,
    })
  }
}

export class Permission3 extends HeyApiClient {
  private _request?: Request
  get request(): Request {
    return (this._request ??= new Request({ client: this.client }))
  }

  private _saved?: Saved
  get saved(): Saved {
    return (this._saved ??= new Saved({ client: this.client }))
  }
}

export class Fs extends HeyApiClient {
  /**
   * 读取文件
   *
   * 提供相对于请求位置的单个文件。
   */
  public read<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2FsReadResponses, V2FsReadErrors, ThrowOnError>({
      url: "/api/fs/read/*",
      ...options,
      ...params,
    })
  }

  /**
   * 列出目录
   *
   * 列出相对于请求位置的目录直接子项。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
      path?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "location" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2FsListResponses, V2FsListErrors, ThrowOnError>({
      url: "/api/fs/list",
      ...options,
      ...params,
    })
  }

  /**
   * 查找文件
   *
   * 递归查找相对于请求位置的文件系统条目并排序。
   */
  public find<ThrowOnError extends boolean = false>(
    parameters: {
      location?: {
        directory?: string
        workspace?: string
      }
      query: string
      type?: "file" | "directory"
      limit?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "location" },
            { in: "query", key: "query" },
            { in: "query", key: "type" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2FsFindResponses, V2FsFindErrors, ThrowOnError>({
      url: "/api/fs/find",
      ...options,
      ...params,
    })
  }
}

export class Command2 extends HeyApiClient {
  /**
   * 列出命令
   *
   * 获取当前已注册的命令。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2CommandListResponses, V2CommandListErrors, ThrowOnError>({
      url: "/api/command",
      ...options,
      ...params,
    })
  }
}

export class Skill extends HeyApiClient {
  /**
   * 列出技能
   *
   * 获取当前已注册的技能。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2SkillListResponses, V2SkillListErrors, ThrowOnError>({
      url: "/api/skill",
      ...options,
      ...params,
    })
  }
}

export class Event2 extends HeyApiClient {
  /**
   * 订阅事件
   *
   * 订阅服务器的原生事件载荷。
   */
  public subscribe<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).sse.get<V2EventSubscribeResponses, V2EventSubscribeErrors, ThrowOnError>({
      url: "/api/event",
      ...options,
    })
  }
}

export class Pty2 extends HeyApiClient {
  /**
   * 列出 PTY 会话
   *
   * 列出位置的 PTY 会话，包括保留到移除前的已退出会话。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2PtyListResponses, V2PtyListErrors, ThrowOnError>({
      url: "/api/pty",
      ...options,
      ...params,
    })
  }

  /**
   * 创建 PTY 会话
   *
   * 为位置创建伪终端会话。
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
      command?: string
      args?: Array<string>
      cwd?: string
      title?: string
      env?: {
        [key: string]: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "location" },
            { in: "body", key: "command" },
            { in: "body", key: "args" },
            { in: "body", key: "cwd" },
            { in: "body", key: "title" },
            { in: "body", key: "env" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2PtyCreateResponses, V2PtyCreateErrors, ThrowOnError>({
      url: "/api/pty",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 移除 PTY 会话
   *
   * 终止并移除单个 PTY 会话。
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<V2PtyRemoveResponses, V2PtyRemoveErrors, ThrowOnError>({
      url: "/api/pty/{ptyID}",
      ...options,
      ...params,
    })
  }

  /**
   * 获取 PTY 会话
   *
   * 获取单个 PTY 会话，包括退出后的退出代码。
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2PtyGetResponses, V2PtyGetErrors, ThrowOnError>({
      url: "/api/pty/{ptyID}",
      ...options,
      ...params,
    })
  }

  /**
   * 更新 PTY 会话
   *
   * 更新单个 PTY 会话的标题或视口大小。
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      location?: {
        directory?: string
        workspace?: string
      }
      title?: string
      size?: {
        rows: number
        cols: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "location" },
            { in: "body", key: "title" },
            { in: "body", key: "size" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put<V2PtyUpdateResponses, V2PtyUpdateErrors, ThrowOnError>({
      url: "/api/pty/{ptyID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * 创建 PTY WebSocket 令牌
   *
   * 创建用于打开 PTY WebSocket 连接的短期一次性票据。
   */
  public connectToken<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2PtyConnectTokenResponses, V2PtyConnectTokenErrors, ThrowOnError>({
      url: "/api/pty/{ptyID}/connect-token",
      ...options,
      ...params,
    })
  }

  /**
   * 连接到 PTY 会话
   *
   * 建立 WebSocket 连接以流式传输 PTY 输出并接收终端输入。
   */
  public connect<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      "location[directory]"?: string
      "location[workspace]"?: string
      cursor?: string
      ticket?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "location[directory]" },
            { in: "query", key: "location[workspace]" },
            { in: "query", key: "cursor" },
            { in: "query", key: "ticket" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2PtyConnectResponses, V2PtyConnectErrors, ThrowOnError>({
      url: "/api/pty/{ptyID}/connect",
      ...options,
      ...params,
    })
  }
}

export class Request2 extends HeyApiClient {
  /**
   * 列出待处理问题请求
   *
   * 获取位置的待处理问题请求。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<
      V2QuestionRequestListResponses,
      V2QuestionRequestListErrors,
      ThrowOnError
    >({
      url: "/api/question/request",
      ...options,
      ...params,
    })
  }
}

export class Question3 extends HeyApiClient {
  private _request?: Request2
  get request(): Request2 {
    return (this._request ??= new Request2({ client: this.client }))
  }
}

export class Reference extends HeyApiClient {
  /**
   * 列出引用
   *
   * 列出请求位置可用的引用。
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "query", key: "location" }] }])
    return (options?.client ?? this.client).get<V2ReferenceListResponses, V2ReferenceListErrors, ThrowOnError>({
      url: "/api/reference",
      ...options,
      ...params,
    })
  }
}

export class ProjectCopy2 extends HeyApiClient {
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      location?: {
        directory?: string
        workspace?: string
      }
      directory?: string
      force?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "location" },
            { in: "body", key: "directory" },
            { in: "body", key: "force" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<
      V2ProjectCopyRemoveResponses,
      V2ProjectCopyRemoveErrors,
      ThrowOnError
    >({
      url: "/experimental/project/{projectID}/copy",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  public create<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      location?: {
        directory?: string
        workspace?: string
      }
      strategy?: string
      directory?: string
      name?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "location" },
            { in: "body", key: "strategy" },
            { in: "body", key: "directory" },
            { in: "body", key: "name" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2ProjectCopyCreateResponses, V2ProjectCopyCreateErrors, ThrowOnError>(
      {
        url: "/experimental/project/{projectID}/copy",
        ...options,
        ...params,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
          ...params.headers,
        },
      },
    )
  }

  public refresh<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      location?: {
        directory?: string
        workspace?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "location" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      V2ProjectCopyRefreshResponses,
      V2ProjectCopyRefreshErrors,
      ThrowOnError
    >({
      url: "/experimental/project/{projectID}/copy/refresh",
      ...options,
      ...params,
    })
  }
}

export class V2 extends HeyApiClient {
  private _health?: Health
  get health(): Health {
    return (this._health ??= new Health({ client: this.client }))
  }

  private _location?: Location
  get location(): Location {
    return (this._location ??= new Location({ client: this.client }))
  }

  private _agent?: Agent
  get agent(): Agent {
    return (this._agent ??= new Agent({ client: this.client }))
  }

  private _session?: Session3
  get session(): Session3 {
    return (this._session ??= new Session3({ client: this.client }))
  }

  private _model?: Model
  get model(): Model {
    return (this._model ??= new Model({ client: this.client }))
  }

  private _provider?: Provider2
  get provider(): Provider2 {
    return (this._provider ??= new Provider2({ client: this.client }))
  }

  private _integration?: Integration
  get integration(): Integration {
    return (this._integration ??= new Integration({ client: this.client }))
  }

  private _credential?: Credential
  get credential(): Credential {
    return (this._credential ??= new Credential({ client: this.client }))
  }

  private _permission?: Permission3
  get permission(): Permission3 {
    return (this._permission ??= new Permission3({ client: this.client }))
  }

  private _fs?: Fs
  get fs(): Fs {
    return (this._fs ??= new Fs({ client: this.client }))
  }

  private _command?: Command2
  get command(): Command2 {
    return (this._command ??= new Command2({ client: this.client }))
  }

  private _skill?: Skill
  get skill(): Skill {
    return (this._skill ??= new Skill({ client: this.client }))
  }

  private _event?: Event2
  get event(): Event2 {
    return (this._event ??= new Event2({ client: this.client }))
  }

  private _pty?: Pty2
  get pty(): Pty2 {
    return (this._pty ??= new Pty2({ client: this.client }))
  }

  private _question?: Question3
  get question(): Question3 {
    return (this._question ??= new Question3({ client: this.client }))
  }

  private _reference?: Reference
  get reference(): Reference {
    return (this._reference ??= new Reference({ client: this.client }))
  }

  private _projectCopy?: ProjectCopy2
  get projectCopy(): ProjectCopy2 {
    return (this._projectCopy ??= new ProjectCopy2({ client: this.client }))
  }
}

export class MiaopanCodeClient extends HeyApiClient {
  public static readonly __registry = new HeyApiRegistry<MiaopanCodeClient>()

  constructor(args?: { client?: Client; key?: string; language?: Language }) {
    super(args)
    MiaopanCodeClient.__registry.set(this, args?.key, args?.language)
  }

  private _auth?: Auth
  get auth(): Auth {
    return (this._auth ??= new Auth({ client: this.client }))
  }

  private _app?: App
  get app(): App {
    return (this._app ??= new App({ client: this.client }))
  }

  private _experimental?: Experimental
  get experimental(): Experimental {
    return (this._experimental ??= new Experimental({ client: this.client }))
  }

  private _global?: Global
  get global(): Global {
    return (this._global ??= new Global({ client: this.client }))
  }

  private _event?: Event
  get event(): Event {
    return (this._event ??= new Event({ client: this.client }))
  }

  private _config?: Config2
  get config(): Config2 {
    return (this._config ??= new Config2({ client: this.client }))
  }

  private _tool?: Tool
  get tool(): Tool {
    return (this._tool ??= new Tool({ client: this.client }))
  }

  private _worktree?: Worktree
  get worktree(): Worktree {
    return (this._worktree ??= new Worktree({ client: this.client }))
  }

  private _find?: Find
  get find(): Find {
    return (this._find ??= new Find({ client: this.client }))
  }

  private _file?: File
  get file(): File {
    return (this._file ??= new File({ client: this.client }))
  }

  private _instance?: Instance
  get instance(): Instance {
    return (this._instance ??= new Instance({ client: this.client }))
  }

  private _path?: Path
  get path(): Path {
    return (this._path ??= new Path({ client: this.client }))
  }

  private _vcs?: Vcs
  get vcs(): Vcs {
    return (this._vcs ??= new Vcs({ client: this.client }))
  }

  private _command?: Command
  get command(): Command {
    return (this._command ??= new Command({ client: this.client }))
  }

  private _lsp?: Lsp
  get lsp(): Lsp {
    return (this._lsp ??= new Lsp({ client: this.client }))
  }

  private _formatter?: Formatter
  get formatter(): Formatter {
    return (this._formatter ??= new Formatter({ client: this.client }))
  }

  private _mcp?: Mcp
  get mcp(): Mcp {
    return (this._mcp ??= new Mcp({ client: this.client }))
  }

  private _project?: Project
  get project(): Project {
    return (this._project ??= new Project({ client: this.client }))
  }

  private _pty?: Pty
  get pty(): Pty {
    return (this._pty ??= new Pty({ client: this.client }))
  }

  private _question?: Question
  get question(): Question {
    return (this._question ??= new Question({ client: this.client }))
  }

  private _permission?: Permission
  get permission(): Permission {
    return (this._permission ??= new Permission({ client: this.client }))
  }

  private _provider?: Provider
  get provider(): Provider {
    return (this._provider ??= new Provider({ client: this.client }))
  }

  private _session?: Session2
  get session(): Session2 {
    return (this._session ??= new Session2({ client: this.client }))
  }

  private _part?: Part
  get part(): Part {
    return (this._part ??= new Part({ client: this.client }))
  }

  private _sync?: Sync
  get sync(): Sync {
    return (this._sync ??= new Sync({ client: this.client }))
  }

  private _tui?: Tui
  get tui(): Tui {
    return (this._tui ??= new Tui({ client: this.client }))
  }

  private _v2?: V2
  get v2(): V2 {
    return (this._v2 ??= new V2({ client: this.client }))
  }
}
