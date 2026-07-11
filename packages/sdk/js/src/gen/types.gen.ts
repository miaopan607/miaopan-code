// 此文件由 @hey-api/openapi-ts 自动生成

export type EventServerInstanceDisposed = {
  type: "server.instance.disposed"
  properties: {
    directory: string
  }
}

export type EventInstallationUpdated = {
  type: "installation.updated"
  properties: {
    version: string
  }
}

export type EventInstallationUpdateAvailable = {
  type: "installation.update-available"
  properties: {
    version: string
  }
}

export type EventLspClientDiagnostics = {
  type: "lsp.client.diagnostics"
  properties: {
    serverID: string
    path: string
  }
}

export type EventLspUpdated = {
  type: "lsp.updated"
  properties: {
    [key: string]: unknown
  }
}

export type FileDiff = {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
}

export type UserMessage = {
  id: string
  sessionID: string
  role: "user"
  time: {
    created: number
  }
  summary?: {
    title?: string
    body?: string
    diffs: Array<FileDiff>
  }
  agent: string
  model: {
    providerID: string
    modelID: string
  }
  system?: string
  tools?: {
    [key: string]: boolean
  }
}

export type ProviderAuthError = {
  name: "ProviderAuthError"
  data: {
    providerID: string
    message: string
  }
}

export type UnknownError = {
  name: "UnknownError"
  data: {
    message: string
  }
}

export type MessageOutputLengthError = {
  name: "MessageOutputLengthError"
  data: {
    [key: string]: unknown
  }
}

export type MessageAbortedError = {
  name: "MessageAbortedError"
  data: {
    message: string
  }
}

export type ApiError = {
  name: "APIError"
  data: {
    message: string
    statusCode?: number
    isRetryable: boolean
    responseHeaders?: {
      [key: string]: string
    }
    responseBody?: string
  }
}

export type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: {
    created: number
    completed?: number
  }
  error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
  parentID: string
  modelID: string
  providerID: string
  mode: string
  path: {
    cwd: string
    root: string
  }
  summary?: boolean
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
  finish?: string
}

export type Message = UserMessage | AssistantMessage

export type EventMessageUpdated = {
  type: "message.updated"
  properties: {
    info: Message
  }
}

export type EventMessageRemoved = {
  type: "message.removed"
  properties: {
    sessionID: string
    messageID: string
  }
}

export type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: {
    [key: string]: unknown
  }
}

export type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: "reasoning"
  text: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end?: number
  }
}

export type FilePartSourceText = {
  value: string
  start: number
  end: number
}

export type FileSource = {
  text: FilePartSourceText
  type: "file"
  path: string
}

export type Range = {
  start: {
    line: number
    character: number
  }
  end: {
    line: number
    character: number
  }
}

export type SymbolSource = {
  text: FilePartSourceText
  type: "symbol"
  path: string
  range: Range
  name: string
  kind: number
}

export type FilePartSource = FileSource | SymbolSource

export type FilePart = {
  id: string
  sessionID: string
  messageID: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type ToolStatePending = {
  status: "pending"
  input: {
    [key: string]: unknown
  }
  raw: string
}

export type ToolStateRunning = {
  status: "running"
  input: {
    [key: string]: unknown
  }
  title?: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
  }
}

export type ToolStateCompleted = {
  status: "completed"
  input: {
    [key: string]: unknown
  }
  output: string
  title: string
  metadata: {
    [key: string]: unknown
  }
  time: {
    start: number
    end: number
    compacted?: number
  }
  attachments?: Array<FilePart>
}

export type ToolStateError = {
  status: "error"
  input: {
    [key: string]: unknown
  }
  error: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end: number
  }
}

export type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError

export type ToolPart = {
  id: string
  sessionID: string
  messageID: string
  type: "tool"
  callID: string
  tool: string
  state: ToolState
  metadata?: {
    [key: string]: unknown
  }
}

export type StepStartPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-start"
  snapshot?: string
}

export type StepFinishPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-finish"
  reason: string
  snapshot?: string
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}

export type SnapshotPart = {
  id: string
  sessionID: string
  messageID: string
  type: "snapshot"
  snapshot: string
}

export type PatchPart = {
  id: string
  sessionID: string
  messageID: string
  type: "patch"
  hash: string
  files: Array<string>
}

export type AgentPart = {
  id: string
  sessionID: string
  messageID: string
  type: "agent"
  name: string
  source?: {
    value: string
    start: number
    end: number
  }
}

export type RetryPart = {
  id: string
  sessionID: string
  messageID: string
  type: "retry"
  attempt: number
  error: ApiError
  time: {
    created: number
  }
}

export type CompactionPart = {
  id: string
  sessionID: string
  messageID: string
  type: "compaction"
  auto: boolean
}

export type Part =
  | TextPart
  | {
      id: string
      sessionID: string
      messageID: string
      type: "subtask"
      prompt: string
      description: string
      agent: string
    }
  | ReasoningPart
  | FilePart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | SnapshotPart
  | PatchPart
  | AgentPart
  | RetryPart
  | CompactionPart

export type EventMessagePartUpdated = {
  type: "message.part.updated"
  properties: {
    part: Part
    delta?: string
  }
}

export type EventMessagePartRemoved = {
  type: "message.part.removed"
  properties: {
    sessionID: string
    messageID: string
    partID: string
  }
}

export type Permission = {
  id: string
  type: string
  pattern?: string | Array<string>
  sessionID: string
  messageID: string
  callID?: string
  title: string
  metadata: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
}

export type EventPermissionUpdated = {
  type: "permission.updated"
  properties: Permission
}

export type EventPermissionReplied = {
  type: "permission.replied"
  properties: {
    sessionID: string
    permissionID: string
    response: string
  }
}

export type SessionStatus =
  | {
      type: "idle"
    }
  | {
      type: "retry"
      attempt: number
      message: string
      next: number
    }
  | {
      type: "busy"
    }

export type EventSessionStatus = {
  type: "session.status"
  properties: {
    sessionID: string
    status: SessionStatus
  }
}

export type EventSessionIdle = {
  type: "session.idle"
  properties: {
    sessionID: string
  }
}

export type EventSessionCompacted = {
  type: "session.compacted"
  properties: {
    sessionID: string
  }
}

export type EventFileEdited = {
  type: "file.edited"
  properties: {
    file: string
  }
}

export type Todo = {
  /**
   * 任务的简要描述
   */
  content: string
  /**
   * 任务当前状态：pending、in_progress、completed、cancelled
   */
  status: string
  /**
   * 任务优先级：high、medium、low
   */
  priority: string
  /**
   * 待办事项的唯一标识符
   */
  id: string
}

export type EventTodoUpdated = {
  type: "todo.updated"
  properties: {
    sessionID: string
    todos: Array<Todo>
  }
}

export type EventCommandExecuted = {
  type: "command.executed"
  properties: {
    name: string
    sessionID: string
    arguments: string
    messageID: string
  }
}

export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: Array<FileDiff>
  }
  share?: {
    url: string
  }
  title: string
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
  }
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}

export type EventSessionCreated = {
  type: "session.created"
  properties: {
    info: Session
  }
}

export type EventSessionUpdated = {
  type: "session.updated"
  properties: {
    info: Session
  }
}

export type EventSessionDeleted = {
  type: "session.deleted"
  properties: {
    info: Session
  }
}

export type EventSessionDiff = {
  type: "session.diff"
  properties: {
    sessionID: string
    diff: Array<FileDiff>
  }
}

export type EventSessionError = {
  type: "session.error"
  properties: {
    sessionID?: string
    error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
  }
}

export type EventFileWatcherUpdated = {
  type: "file.watcher.updated"
  properties: {
    file: string
    event: "add" | "change" | "unlink"
  }
}

export type EventVcsBranchUpdated = {
  type: "vcs.branch.updated"
  properties: {
    branch?: string
  }
}

export type EventTuiPromptAppend = {
  type: "tui.prompt.append"
  properties: {
    text: string
  }
}

export type EventTuiCommandExecute = {
  type: "tui.command.execute"
  properties: {
    command:
      | (
          | "session.list"
          | "session.new"
          | "session.share"
          | "session.interrupt"
          | "session.compact"
          | "session.page.up"
          | "session.page.down"
          | "session.half.page.up"
          | "session.half.page.down"
          | "session.first"
          | "session.last"
          | "prompt.clear"
          | "prompt.submit"
          | "agent.cycle"
        )
      | string
  }
}

export type EventTuiToastShow = {
  type: "tui.toast.show"
  properties: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    /**
     * 持续时间（毫秒）
     */
    duration?: number
  }
}

export type Pty = {
  id: string
  title: string
  command: string
  args: Array<string>
  cwd: string
  status: "running" | "exited"
  pid: number
}

export type EventPtyCreated = {
  type: "pty.created"
  properties: {
    info: Pty
  }
}

export type EventPtyUpdated = {
  type: "pty.updated"
  properties: {
    info: Pty
  }
}

export type EventPtyExited = {
  type: "pty.exited"
  properties: {
    id: string
    exitCode: number
  }
}

export type EventPtyDeleted = {
  type: "pty.deleted"
  properties: {
    id: string
  }
}

export type EventServerConnected = {
  type: "server.connected"
  properties: {
    [key: string]: unknown
  }
}

export type Event =
  | EventServerInstanceDisposed
  | EventInstallationUpdated
  | EventInstallationUpdateAvailable
  | EventLspClientDiagnostics
  | EventLspUpdated
  | EventMessageUpdated
  | EventMessageRemoved
  | EventMessagePartUpdated
  | EventMessagePartRemoved
  | EventPermissionUpdated
  | EventPermissionReplied
  | EventSessionStatus
  | EventSessionIdle
  | EventSessionCompacted
  | EventFileEdited
  | EventTodoUpdated
  | EventCommandExecuted
  | EventSessionCreated
  | EventSessionUpdated
  | EventSessionDeleted
  | EventSessionDiff
  | EventSessionError
  | EventFileWatcherUpdated
  | EventVcsBranchUpdated
  | EventTuiPromptAppend
  | EventTuiCommandExecute
  | EventTuiToastShow
  | EventPtyCreated
  | EventPtyUpdated
  | EventPtyExited
  | EventPtyDeleted
  | EventServerConnected

export type GlobalEvent = {
  directory: string
  payload: Event
}

export type Project = {
  id: string
  worktree: string
  vcsDir?: string
  vcs?: "git"
  time: {
    created: number
    initialized?: number
  }
}

export type BadRequestError = {
  name: "BadRequest"
  data: {
    message: string
    kind?: "Params" | "Headers" | "Query" | "Body" | "Payload"
  }
}

export type NotFoundError = {
  name: "NotFoundError"
  data: {
    message: string
  }
}

/**
 * 自定义快捷键配置
 */
export type KeybindsConfig = {
  /**
   * 快捷键组合的前导键
   */
  leader?: string
  /**
   * 退出应用
   */
  app_exit?: string
  /**
   * 打开外部编辑器
   */
  editor_open?: string
  /**
   * 列出可用主题
   */
  theme_list?: string
  /**
   * 切换侧边栏
   */
  sidebar_toggle?: string
  /**
   * 切换会话滚动条
   */
  scrollbar_toggle?: string
  /**
   * 切换用户名显示
   */
  username_toggle?: string
  /**
   * 查看状态
   */
  status_view?: string
  /**
   * 将会话导出到编辑器
   */
  session_export?: string
  /**
   * 创建新会话
   */
  session_new?: string
  /**
   * 列出所有会话
   */
  session_list?: string
  /**
   * 显示会话时间线
   */
  session_timeline?: string
  /**
   * 共享当前会话
   */
  session_share?: string
  /**
   * 取消共享当前会话
   */
  session_unshare?: string
  /**
   * 中断当前会话
   */
  session_interrupt?: string
  /**
   * 压缩会话
   */
  session_compact?: string
  /**
   * 向上滚动一页消息
   */
  messages_page_up?: string
  /**
   * 向下滚动一页消息
   */
  messages_page_down?: string
  /**
   * 向上滚动一行消息
   */
  messages_line_up?: string
  /**
   * 向下滚动一行消息
   */
  messages_line_down?: string
  /**
   * 向上滚动半页消息
   */
  messages_half_page_up?: string
  /**
   * 向下滚动半页消息
   */
  messages_half_page_down?: string
  /**
   * 跳转到第一条消息
   */
  messages_first?: string
  /**
   * 跳转到最后一条消息
   */
  messages_last?: string
  /**
   * 跳转到下一条消息
   */
  messages_next?: string
  /**
   * 跳转到上一条消息
   */
  messages_previous?: string
  /**
   * 跳转到最后一条用户消息
   */
  messages_last_user?: string
  /**
   * 复制消息
   */
  messages_copy?: string
  /**
   * 撤销消息
   */
  messages_undo?: string
  /**
   * 重做消息
   */
  messages_redo?: string
  /**
   * 切换消息中的代码块隐藏状态
   */
  messages_toggle_conceal?: string
  /**
   * 切换工具详情显示
   */
  tool_details?: string
  /**
   * 列出可用模型
   */
  model_list?: string
  /**
   * 切换到下一个最近使用的模型
   */
  model_cycle_recent?: string
  /**
   * 切换到上一个最近使用的模型
   */
  model_cycle_recent_reverse?: string
  /**
   * 列出可用命令
   */
  command_list?: string
  /**
   * 列出代理
   */
  agent_list?: string
  /**
   * 切换到下一个代理
   */
  agent_cycle?: string
  /**
   * 切换到上一个代理
   */
  agent_cycle_reverse?: string
  /**
   * 清除输入框
   */
  input_clear?: string
  /**
   * 向前删除
   */
  input_forward_delete?: string
  /**
   * 从剪贴板粘贴
   */
  input_paste?: string
  /**
   * 提交输入
   */
  input_submit?: string
  /**
   * 在输入中插入换行
   */
  input_newline?: string
  /**
   * 上一条历史记录
   */
  history_previous?: string
  /**
   * 下一条历史记录
   */
  history_next?: string
  /**
   * 下一个子会话
   */
  session_child_cycle?: string
  /**
   * 上一个子会话
   */
  session_child_cycle_reverse?: string
  /**
   * 挂起终端
   */
  terminal_suspend?: string
  /**
   * 切换终端标题
   */
  terminal_title_toggle?: string
}

export type AgentConfig = {
  model?: string
  temperature?: number
  top_p?: number
  prompt?: string
  tools?: {
    [key: string]: boolean
  }
  disable?: boolean
  /**
   * 代理适用场景的描述
   */
  description?: string
  mode?: "subagent" | "primary" | "all"
  /**
   * 代理的十六进制颜色代码（例如 #FF5733）
   */
  color?: string
  /**
   * 强制仅文本响应前允许的最大代理迭代次数
   */
  maxSteps?: number
  permission?: {
    edit?: "ask" | "allow" | "deny"
    bash?:
      | ("ask" | "allow" | "deny")
      | {
          [key: string]: "ask" | "allow" | "deny"
        }
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
  [key: string]:
    | unknown
    | string
    | number
    | {
        [key: string]: boolean
      }
    | boolean
    | ("subagent" | "primary" | "all")
    | number
    | {
        edit?: "ask" | "allow" | "deny"
        bash?:
          | ("ask" | "allow" | "deny")
          | {
              [key: string]: "ask" | "allow" | "deny"
            }
        webfetch?: "ask" | "allow" | "deny"
        doom_loop?: "ask" | "allow" | "deny"
        external_directory?: "ask" | "allow" | "deny"
      }
    | undefined
}

export type ProviderConfig = {
  api?: string
  name?: string
  env?: Array<string>
  id?: string
  npm?: string
  models?: {
    [key: string]: {
      id?: string
      name?: string
      release_date?: string
      attachment?: boolean
      reasoning?: boolean
      temperature?: boolean
      tool_call?: boolean
      cost?: {
        input: number
        output: number
        cache_read?: number
        cache_write?: number
        context_over_200k?: {
          input: number
          output: number
          cache_read?: number
          cache_write?: number
        }
      }
      limit?: {
        context: number
        output: number
      }
      modalities?: {
        input: Array<"text" | "audio" | "image" | "video" | "pdf">
        output: Array<"text" | "audio" | "image" | "video" | "pdf">
      }
      experimental?: boolean
      status?: "alpha" | "beta" | "deprecated" | "active"
      options?: {
        [key: string]: unknown
      }
      headers?: {
        [key: string]: string
      }
      provider?: {
        npm: string
      }
    }
  }
  whitelist?: Array<string>
  blacklist?: Array<string>
  options?: {
    apiKey?: string
    baseURL?: string
    /**
     * 用于 Copilot 身份验证的 GitHub Enterprise URL
     */
    enterpriseUrl?: string
    /**
     * 为此提供商启用 promptCacheKey（默认为 false）
     */
    setCacheKey?: boolean
    /**
     * 向此提供商发出请求的超时时间（毫秒）。默认为 300000（5 分钟）；设为 false 可禁用超时。
     */
    timeout?: number | false
    [key: string]: unknown | string | boolean | (number | false) | undefined
  }
}

export type McpLocalConfig = {
  /**
   * MCP 服务器连接类型
   */
  type: "local"
  /**
   * 运行 MCP 服务器的命令和参数
   */
  command: Array<string>
  /**
   * 运行 MCP 服务器时设置的环境变量
   */
  environment?: {
    [key: string]: string
  }
  /**
   * 启动时启用或禁用 MCP 服务器
   */
  enabled?: boolean
  /**
   * 从 MCP 服务器获取工具的超时时间（毫秒）。未指定时默认为 5000（5 秒）。
   */
  timeout?: number
}

export type McpOAuthConfig = {
  /**
   * OAuth 客户端 ID。未提供时会尝试动态客户端注册（RFC 7591）。
   */
  clientId?: string
  /**
   * OAuth 客户端密钥（授权服务器需要时）
   */
  clientSecret?: string
  /**
   * 授权期间请求的 OAuth scope
   */
  scope?: string
}

export type McpRemoteConfig = {
  /**
   * MCP 服务器连接类型
   */
  type: "remote"
  /**
   * 远程 MCP 服务器 URL
   */
  url: string
  /**
   * 启动时启用或禁用 MCP 服务器
   */
  enabled?: boolean
  /**
   * 随请求发送的标头
   */
  headers?: {
    [key: string]: string
  }
  /**
   * MCP 服务器的 OAuth 身份验证配置。设为 false 可禁用 OAuth 自动检测。
   */
  oauth?: McpOAuthConfig | false
  /**
   * 从 MCP 服务器获取工具的超时时间（毫秒）。未指定时默认为 5000（5 秒）。
   */
  timeout?: number
}

/**
 * @deprecated 始终使用 stretch 布局。
 */
export type LayoutConfig = "auto" | "stretch"

export type Config = {
  /**
   * 用于配置验证的 JSON Schema 引用
   */
  $schema?: string
  /**
   * 界面使用的主题名称
   */
  theme?: string
  keybinds?: KeybindsConfig
  /**
   * 日志级别
   */
  logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR"
  /**
   * TUI 专用设置
   */
  tui?: {
    /**
     * TUI 滚动速度
     */
    scroll_speed?: number
    /**
     * 滚动加速设置
     */
    scroll_acceleration?: {
      /**
       * 启用滚动加速
       */
      enabled: boolean
    }
    /**
     * 控制差异渲染样式：auto 会适应终端宽度，stacked 始终使用单列。
     */
    diff_style?: "auto" | "stacked"
  }
  /**
   * 命令配置，参见 https://github.com/miaopan607/miaopan-code/docs/commands
   */
  command?: {
    [key: string]: {
      template: string
      description?: string
      agent?: string
      model?: string
      subtask?: boolean
    }
  }
  watcher?: {
    ignore?: Array<string>
  }
  plugin?: Array<string>
  snapshot?: boolean
  /**
   * 控制共享行为：manual 允许通过命令手动共享，auto 启用自动共享，disabled 禁用所有共享。
   */
  share?: "manual" | "auto" | "disabled"
  /**
   * @deprecated 请改用 share 字段。自动共享新创建的会话。
   */
  autoshare?: boolean
  /**
   * 自动更新到最新版本。设为 true 可自动更新，false 可禁用，notify 则显示更新通知。
   */
  autoupdate?: boolean | "notify"
  /**
   * 禁用自动加载的提供商
   */
  disabled_providers?: Array<string>
  /**
   * 设置后仅启用这些提供商，忽略所有其他提供商。
   */
  enabled_providers?: Array<string>
  /**
   * 使用的模型，格式为 provider/model，例如 anthropic/claude-2
   */
  model?: string
  /**
   * 用于标题生成等任务的小模型，格式为 provider/model
   */
  small_model?: string
  /**
   * 在对话中代替系统用户名显示的自定义用户名
   */
  username?: string
  /**
   * @deprecated 请改用 agent 字段。
   */
  mode?: {
    build?: AgentConfig
    plan?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  /**
   * 代理配置，参见 https://github.com/miaopan607/miaopan-code/docs/agent
   */
  agent?: {
    plan?: AgentConfig
    build?: AgentConfig
    general?: AgentConfig
    explore?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  /**
   * 自定义提供商配置和模型覆盖
   */
  provider?: {
    [key: string]: ProviderConfig
  }
  /**
   * MCP（模型上下文协议）服务器配置
   */
  mcp?: {
    [key: string]: McpLocalConfig | McpRemoteConfig
  }
  formatter?:
    | false
    | {
        [key: string]: {
          disabled?: boolean
          command?: Array<string>
          environment?: {
            [key: string]: string
          }
          extensions?: Array<string>
        }
      }
  lsp?:
    | false
    | {
        [key: string]:
          | {
              disabled: true
            }
          | {
              command: Array<string>
              extensions?: Array<string>
              disabled?: boolean
              env?: {
                [key: string]: string
              }
              initialization?: {
                [key: string]: unknown
              }
            }
      }
  /**
   * 要包含的额外指令文件或模式
   */
  instructions?: Array<string>
  layout?: LayoutConfig
  permission?: {
    edit?: "ask" | "allow" | "deny"
    bash?:
      | ("ask" | "allow" | "deny")
      | {
          [key: string]: "ask" | "allow" | "deny"
        }
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
  tools?: {
    [key: string]: boolean
  }
  enterprise?: {
    /**
     * 企业版 URL
     */
    url?: string
  }
  experimental?: {
    hook?: {
      file_edited?: {
        [key: string]: Array<{
          command: Array<string>
          environment?: {
            [key: string]: string
          }
        }>
      }
      session_completed?: Array<{
        command: Array<string>
        environment?: {
          [key: string]: string
        }
      }>
    }
    /**
     * 聊天补全失败时的重试次数
     */
    chatMaxRetries?: number
    disable_paste_summary?: boolean
    /**
     * 启用批处理工具
     */
    batch_tool?: boolean
    /**
     * 为 AI SDK 调用启用 OpenTelemetry span（使用 experimental_telemetry 标志）
     */
    openTelemetry?: boolean
    /**
     * 仅主代理可用的工具。
     */
    primary_tools?: Array<string>
  }
}

export type ToolIds = Array<string>

export type ToolListItem = {
  id: string
  description: string
  parameters: unknown
}

export type ToolList = Array<ToolListItem>

export type Path = {
  state: string
  config: string
  worktree: string
  directory: string
}

export type VcsInfo = {
  branch: string
}

export type TextPartInput = {
  id?: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: {
    [key: string]: unknown
  }
}

export type FilePartInput = {
  id?: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type AgentPartInput = {
  id?: string
  type: "agent"
  name: string
  source?: {
    value: string
    start: number
    end: number
  }
}

export type SubtaskPartInput = {
  id?: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
}

export type Command = {
  name: string
  description?: string
  agent?: string
  model?: string
  template: string
  subtask?: boolean
}

export type Model = {
  id: string
  providerID: string
  api: {
    id: string
    url: string
    npm: string
  }
  name: string
  capabilities: {
    temperature: boolean
    reasoning: boolean
    attachment: boolean
    toolcall: boolean
    input: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
    output: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
  }
  cost: {
    input: number
    output: number
    cache: {
      read: number
      write: number
    }
    experimentalOver200K?: {
      input: number
      output: number
      cache: {
        read: number
        write: number
      }
    }
  }
  limit: {
    context: number
    output: number
  }
  status: "alpha" | "beta" | "deprecated" | "active"
  options: {
    [key: string]: unknown
  }
  headers: {
    [key: string]: string
  }
}

export type Provider = {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: Array<string>
  key?: string
  options: {
    [key: string]: unknown
  }
  models: {
    [key: string]: Model
  }
}

export type ProviderAuthMethod = {
  type: "oauth" | "api"
  label: string
}

export type ProviderAuthAuthorization = {
  url: string
  method: "auto" | "code"
  instructions: string
}

export type Symbol = {
  name: string
  kind: number
  location: {
    uri: string
    range: Range
  }
}

export type FileNode = {
  name: string
  path: string
  absolute: string
  type: "file" | "directory"
  ignored: boolean
}

export type FileContent = {
  type: "text" | "binary"
  content: string
  diff?: string
  patch?: {
    oldFileName: string
    newFileName: string
    oldHeader?: string
    newHeader?: string
    hunks: Array<{
      oldStart: number
      oldLines: number
      newStart: number
      newLines: number
      lines: Array<string>
    }>
    index?: string
  }
  encoding?: "base64"
  mimeType?: string
}

export type File = {
  path: string
  added: number
  removed: number
  status: "added" | "deleted" | "modified"
}

export type Agent = {
  name: string
  description?: string
  mode: "subagent" | "primary" | "all"
  builtIn: boolean
  topP?: number
  temperature?: number
  color?: string
  permission: {
    edit: "ask" | "allow" | "deny"
    bash: {
      [key: string]: "ask" | "allow" | "deny"
    }
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
  model?: {
    modelID: string
    providerID: string
  }
  prompt?: string
  tools: {
    [key: string]: boolean
  }
  options: {
    [key: string]: unknown
  }
  maxSteps?: number
}

export type McpStatusConnected = {
  status: "connected"
}

export type McpStatusDisabled = {
  status: "disabled"
}

export type McpStatusFailed = {
  status: "failed"
  error: string
}

export type McpStatusNeedsAuth = {
  status: "needs_auth"
}

export type McpStatusNeedsClientRegistration = {
  status: "needs_client_registration"
  error: string
}

export type McpStatus =
  | McpStatusConnected
  | McpStatusDisabled
  | McpStatusFailed
  | McpStatusNeedsAuth
  | McpStatusNeedsClientRegistration

export type LspStatus = {
  id: string
  name: string
  root: string
  status: "connected" | "error"
}

export type FormatterStatus = {
  name: string
  extensions: Array<string>
  enabled: boolean
}

export type OAuth = {
  type: "oauth"
  refresh: string
  access: string
  expires: number
  enterpriseUrl?: string
}

export type ApiAuth = {
  type: "api"
  key: string
  metadata?: {
    [key: string]: string
  }
}

export type WellKnownAuth = {
  type: "wellknown"
  key: string
  token: string
}

export type Auth = OAuth | ApiAuth | WellKnownAuth

export type GlobalEventData = {
  body?: never
  path?: never
  query?: never
  url: "/global/event"
}

export type GlobalEventResponses = {
  /**
   * 事件流
   */
  200: GlobalEvent
}

export type GlobalEventResponse = GlobalEventResponses[keyof GlobalEventResponses]

export type ProjectListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/project"
}

export type ProjectListResponses = {
  /**
   * 项目列表
   */
  200: Array<Project>
}

export type ProjectListResponse = ProjectListResponses[keyof ProjectListResponses]

export type ProjectCurrentData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/project/current"
}

export type ProjectCurrentResponses = {
  /**
   * 当前项目
   */
  200: Project
}

export type ProjectCurrentResponse = ProjectCurrentResponses[keyof ProjectCurrentResponses]

export type PtyListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/pty"
}

export type PtyListResponses = {
  /**
   * 会话列表
   */
  200: Array<Pty>
}

export type PtyListResponse = PtyListResponses[keyof PtyListResponses]

export type PtyCreateData = {
  body?: {
    command?: string
    args?: Array<string>
    cwd?: string
    title?: string
    env?: {
      [key: string]: string
    }
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/pty"
}

export type PtyCreateErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type PtyCreateError = PtyCreateErrors[keyof PtyCreateErrors]

export type PtyCreateResponses = {
  /**
   * 已创建的会话
   */
  200: Pty
}

export type PtyCreateResponse = PtyCreateResponses[keyof PtyCreateResponses]

export type PtyRemoveData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}"
}

export type PtyRemoveErrors = {
  /**
   * 未找到
   */
  404: NotFoundError
}

export type PtyRemoveError = PtyRemoveErrors[keyof PtyRemoveErrors]

export type PtyRemoveResponses = {
  /**
   * 会话已移除
   */
  200: boolean
}

export type PtyRemoveResponse = PtyRemoveResponses[keyof PtyRemoveResponses]

export type PtyGetData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}"
}

export type PtyGetErrors = {
  /**
   * 未找到
   */
  404: NotFoundError
}

export type PtyGetError = PtyGetErrors[keyof PtyGetErrors]

export type PtyGetResponses = {
  /**
   * 会话信息
   */
  200: Pty
}

export type PtyGetResponse = PtyGetResponses[keyof PtyGetResponses]

export type PtyUpdateData = {
  body?: {
    title?: string
    size?: {
      rows: number
      cols: number
    }
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}"
}

export type PtyUpdateErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type PtyUpdateError = PtyUpdateErrors[keyof PtyUpdateErrors]

export type PtyUpdateResponses = {
  /**
   * 会话已更新
   */
  200: Pty
}

export type PtyUpdateResponse = PtyUpdateResponses[keyof PtyUpdateResponses]

export type PtyConnectData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}/connect"
}

export type PtyConnectErrors = {
  /**
   * 未找到
   */
  404: NotFoundError
}

export type PtyConnectError = PtyConnectErrors[keyof PtyConnectErrors]

export type PtyConnectResponses = {
  /**
   * 已连接的会话
   */
  200: boolean
}

export type PtyConnectResponse = PtyConnectResponses[keyof PtyConnectResponses]

export type ConfigGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/config"
}

export type ConfigGetResponses = {
  /**
   * 配置信息
   */
  200: Config
}

export type ConfigGetResponse = ConfigGetResponses[keyof ConfigGetResponses]

export type ConfigUpdateData = {
  body?: Config
  path?: never
  query?: {
    directory?: string
  }
  url: "/config"
}

export type ConfigUpdateErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type ConfigUpdateError = ConfigUpdateErrors[keyof ConfigUpdateErrors]

export type ConfigUpdateResponses = {
  /**
   * 配置已成功更新
   */
  200: Config
}

export type ConfigUpdateResponse = ConfigUpdateResponses[keyof ConfigUpdateResponses]

export type ToolIdsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/experimental/tool/ids"
}

export type ToolIdsErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type ToolIdsError = ToolIdsErrors[keyof ToolIdsErrors]

export type ToolIdsResponses = {
  /**
   * 工具 ID
   */
  200: ToolIds
}

export type ToolIdsResponse = ToolIdsResponses[keyof ToolIdsResponses]

export type ToolListData = {
  body?: never
  path?: never
  query: {
    directory?: string
    provider: string
    model: string
  }
  url: "/experimental/tool"
}

export type ToolListErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type ToolListError = ToolListErrors[keyof ToolListErrors]

export type ToolListResponses = {
  /**
   * Tools
   */
  200: ToolList
}

export type ToolListResponse = ToolListResponses[keyof ToolListResponses]

export type InstanceDisposeData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/instance/dispose"
}

export type InstanceDisposeResponses = {
  /**
   * 实例已释放
   */
  200: boolean
}

export type InstanceDisposeResponse = InstanceDisposeResponses[keyof InstanceDisposeResponses]

export type PathGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/path"
}

export type PathGetResponses = {
  /**
   * Path
   */
  200: Path
}

export type PathGetResponse = PathGetResponses[keyof PathGetResponses]

export type VcsGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/vcs"
}

export type VcsGetResponses = {
  /**
   * 版本控制信息
   */
  200: VcsInfo
}

export type VcsGetResponse = VcsGetResponses[keyof VcsGetResponses]

export type SessionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/session"
}

export type SessionListResponses = {
  /**
   * 会话列表
   */
  200: Array<Session>
}

export type SessionListResponse = SessionListResponses[keyof SessionListResponses]

export type SessionCreateData = {
  body?: {
    parentID?: string
    title?: string
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/session"
}

export type SessionCreateErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type SessionCreateError = SessionCreateErrors[keyof SessionCreateErrors]

export type SessionCreateResponses = {
  /**
   * 会话已成功创建
   */
  200: Session
}

export type SessionCreateResponse = SessionCreateResponses[keyof SessionCreateResponses]

export type SessionStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/session/status"
}

export type SessionStatusErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type SessionStatusError = SessionStatusErrors[keyof SessionStatusErrors]

export type SessionStatusResponses = {
  /**
   * 会话状态
   */
  200: {
    [key: string]: SessionStatus
  }
}

export type SessionStatusResponse = SessionStatusResponses[keyof SessionStatusResponses]

export type SessionDeleteData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}"
}

export type SessionDeleteErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionDeleteError = SessionDeleteErrors[keyof SessionDeleteErrors]

export type SessionDeleteResponses = {
  /**
   * 会话已成功删除
   */
  200: boolean
}

export type SessionDeleteResponse = SessionDeleteResponses[keyof SessionDeleteResponses]

export type SessionGetData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}"
}

export type SessionGetErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionGetError = SessionGetErrors[keyof SessionGetErrors]

export type SessionGetResponses = {
  /**
   * 获取会话
   */
  200: Session
}

export type SessionGetResponse = SessionGetResponses[keyof SessionGetResponses]

export type SessionUpdateData = {
  body?: {
    title?: string
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}"
}

export type SessionUpdateErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionUpdateError = SessionUpdateErrors[keyof SessionUpdateErrors]

export type SessionUpdateResponses = {
  /**
   * 会话已成功更新
   */
  200: Session
}

export type SessionUpdateResponse = SessionUpdateResponses[keyof SessionUpdateResponses]

export type SessionChildrenData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/children"
}

export type SessionChildrenErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionChildrenError = SessionChildrenErrors[keyof SessionChildrenErrors]

export type SessionChildrenResponses = {
  /**
   * 子会话列表
   */
  200: Array<Session>
}

export type SessionChildrenResponse = SessionChildrenResponses[keyof SessionChildrenResponses]

export type SessionTodoData = {
  body?: never
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/todo"
}

export type SessionTodoErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionTodoError = SessionTodoErrors[keyof SessionTodoErrors]

export type SessionTodoResponses = {
  /**
   * 待办列表
   */
  200: Array<Todo>
}

export type SessionTodoResponse = SessionTodoResponses[keyof SessionTodoResponses]

export type SessionInitData = {
  body?: {
    modelID: string
    providerID: string
    messageID: string
  }
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/init"
}

export type SessionInitErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionInitError = SessionInitErrors[keyof SessionInitErrors]

export type SessionInitResponses = {
  /**
   * 200
   */
  200: boolean
}

export type SessionInitResponse = SessionInitResponses[keyof SessionInitResponses]

export type SessionForkData = {
  body?: {
    messageID?: string
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/fork"
}

export type SessionForkResponses = {
  /**
   * 200
   */
  200: Session
}

export type SessionForkResponse = SessionForkResponses[keyof SessionForkResponses]

export type SessionAbortData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/abort"
}

export type SessionAbortErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionAbortError = SessionAbortErrors[keyof SessionAbortErrors]

export type SessionAbortResponses = {
  /**
   * 会话已中止
   */
  200: boolean
}

export type SessionAbortResponse = SessionAbortResponses[keyof SessionAbortResponses]

export type SessionUnshareData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/share"
}

export type SessionUnshareErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionUnshareError = SessionUnshareErrors[keyof SessionUnshareErrors]

export type SessionUnshareResponses = {
  /**
   * 会话已成功取消共享
   */
  200: Session
}

export type SessionUnshareResponse = SessionUnshareResponses[keyof SessionUnshareResponses]

export type SessionShareData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/share"
}

export type SessionShareErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionShareError = SessionShareErrors[keyof SessionShareErrors]

export type SessionShareResponses = {
  /**
   * 会话已成功共享
   */
  200: Session
}

export type SessionShareResponse = SessionShareResponses[keyof SessionShareResponses]

export type SessionDiffData = {
  body?: never
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
    messageID?: string
  }
  url: "/session/{id}/diff"
}

export type SessionDiffErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionDiffError = SessionDiffErrors[keyof SessionDiffErrors]

export type SessionDiffResponses = {
  /**
   * 差异列表
   */
  200: Array<FileDiff>
}

export type SessionDiffResponse = SessionDiffResponses[keyof SessionDiffResponses]

export type SessionSummarizeData = {
  body?: {
    providerID: string
    modelID: string
  }
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/summarize"
}

export type SessionSummarizeErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionSummarizeError = SessionSummarizeErrors[keyof SessionSummarizeErrors]

export type SessionSummarizeResponses = {
  /**
   * 会话已总结
   */
  200: boolean
}

export type SessionSummarizeResponse = SessionSummarizeResponses[keyof SessionSummarizeResponses]

export type SessionMessagesData = {
  body?: never
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
    limit?: number
  }
  url: "/session/{id}/message"
}

export type SessionMessagesErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionMessagesError = SessionMessagesErrors[keyof SessionMessagesErrors]

export type SessionMessagesResponses = {
  /**
   * 消息列表
   */
  200: Array<{
    info: Message
    parts: Array<Part>
  }>
}

export type SessionMessagesResponse = SessionMessagesResponses[keyof SessionMessagesResponses]

export type SessionPromptData = {
  body?: {
    messageID?: string
    model?: {
      providerID: string
      modelID: string
    }
    agent?: string
    noReply?: boolean
    system?: string
    tools?: {
      [key: string]: boolean
    }
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/message"
}

export type SessionPromptErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionPromptError = SessionPromptErrors[keyof SessionPromptErrors]

export type SessionPromptResponses = {
  /**
   * 消息已创建
   */
  200: {
    info: AssistantMessage
    parts: Array<Part>
  }
}

export type SessionPromptResponse = SessionPromptResponses[keyof SessionPromptResponses]

export type SessionMessageData = {
  body?: never
  path: {
    /**
     * 会话 ID
     */
    id: string
    /**
     * 消息 ID
     */
    messageID: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/message/{messageID}"
}

export type SessionMessageErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionMessageError = SessionMessageErrors[keyof SessionMessageErrors]

export type SessionMessageResponses = {
  /**
   * Message
   */
  200: {
    info: Message
    parts: Array<Part>
  }
}

export type SessionMessageResponse = SessionMessageResponses[keyof SessionMessageResponses]

export type SessionPromptAsyncData = {
  body?: {
    messageID?: string
    model?: {
      providerID: string
      modelID: string
    }
    agent?: string
    noReply?: boolean
    system?: string
    tools?: {
      [key: string]: boolean
    }
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/prompt_async"
}

export type SessionPromptAsyncErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionPromptAsyncError = SessionPromptAsyncErrors[keyof SessionPromptAsyncErrors]

export type SessionPromptAsyncResponses = {
  /**
   * 提示已接受
   */
  204: void
}

export type SessionPromptAsyncResponse = SessionPromptAsyncResponses[keyof SessionPromptAsyncResponses]

export type SessionCommandData = {
  body?: {
    messageID?: string
    agent?: string
    model?: string
    arguments: string
    command: string
  }
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/command"
}

export type SessionCommandErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionCommandError = SessionCommandErrors[keyof SessionCommandErrors]

export type SessionCommandResponses = {
  /**
   * 消息已创建
   */
  200: {
    info: AssistantMessage
    parts: Array<Part>
  }
}

export type SessionCommandResponse = SessionCommandResponses[keyof SessionCommandResponses]

export type SessionShellData = {
  body?: {
    agent: string
    model?: {
      providerID: string
      modelID: string
    }
    command: string
  }
  path: {
    /**
     * 会话 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/shell"
}

export type SessionShellErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionShellError = SessionShellErrors[keyof SessionShellErrors]

export type SessionShellResponses = {
  /**
   * 消息已创建
   */
  200: AssistantMessage
}

export type SessionShellResponse = SessionShellResponses[keyof SessionShellResponses]

export type SessionRevertData = {
  body?: {
    messageID: string
    partID?: string
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/revert"
}

export type SessionRevertErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionRevertError = SessionRevertErrors[keyof SessionRevertErrors]

export type SessionRevertResponses = {
  /**
   * 会话已更新
   */
  200: Session
}

export type SessionRevertResponse = SessionRevertResponses[keyof SessionRevertResponses]

export type SessionUnrevertData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/unrevert"
}

export type SessionUnrevertErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type SessionUnrevertError = SessionUnrevertErrors[keyof SessionUnrevertErrors]

export type SessionUnrevertResponses = {
  /**
   * 会话已更新
   */
  200: Session
}

export type SessionUnrevertResponse = SessionUnrevertResponses[keyof SessionUnrevertResponses]

export type PostSessionIdPermissionsPermissionIdData = {
  body?: {
    response: "once" | "always" | "reject"
  }
  path: {
    id: string
    permissionID: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/permissions/{permissionID}"
}

export type PostSessionIdPermissionsPermissionIdErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type PostSessionIdPermissionsPermissionIdError =
  PostSessionIdPermissionsPermissionIdErrors[keyof PostSessionIdPermissionsPermissionIdErrors]

export type PostSessionIdPermissionsPermissionIdResponses = {
  /**
   * 权限已成功处理
   */
  200: boolean
}

export type PostSessionIdPermissionsPermissionIdResponse =
  PostSessionIdPermissionsPermissionIdResponses[keyof PostSessionIdPermissionsPermissionIdResponses]

export type CommandListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/command"
}

export type CommandListResponses = {
  /**
   * 命令列表
   */
  200: Array<Command>
}

export type CommandListResponse = CommandListResponses[keyof CommandListResponses]

export type ConfigProvidersData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/config/providers"
}

export type ConfigProvidersResponses = {
  /**
   * 提供商列表
   */
  200: {
    providers: Array<Provider>
    default: {
      [key: string]: string
    }
  }
}

export type ConfigProvidersResponse = ConfigProvidersResponses[keyof ConfigProvidersResponses]

export type ProviderListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/provider"
}

export type ProviderListResponses = {
  /**
   * 提供商列表
   */
  200: {
    all: Array<{
      api?: string
      name: string
      env: Array<string>
      id: string
      npm?: string
      models: {
        [key: string]: {
          id: string
          name: string
          release_date: string
          attachment: boolean
          reasoning: boolean
          temperature: boolean
          tool_call: boolean
          cost?: {
            input: number
            output: number
            cache_read?: number
            cache_write?: number
            context_over_200k?: {
              input: number
              output: number
              cache_read?: number
              cache_write?: number
            }
          }
          limit: {
            context: number
            output: number
          }
          modalities?: {
            input: Array<"text" | "audio" | "image" | "video" | "pdf">
            output: Array<"text" | "audio" | "image" | "video" | "pdf">
          }
          experimental?: boolean
          status?: "alpha" | "beta" | "deprecated" | "active"
          options: {
            [key: string]: unknown
          }
          headers?: {
            [key: string]: string
          }
          provider?: {
            npm: string
          }
        }
      }
    }>
    default: {
      [key: string]: string
    }
    connected: Array<string>
  }
}

export type ProviderListResponse = ProviderListResponses[keyof ProviderListResponses]

export type ProviderAuthData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/provider/auth"
}

export type ProviderAuthResponses = {
  /**
   * 提供商身份验证方式
   */
  200: {
    [key: string]: Array<ProviderAuthMethod>
  }
}

export type ProviderAuthResponse = ProviderAuthResponses[keyof ProviderAuthResponses]

export type ProviderOauthAuthorizeData = {
  body?: {
    /**
     * 身份验证方式索引
     */
    method: number
  }
  path: {
    /**
     * 提供商 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/provider/{id}/oauth/authorize"
}

export type ProviderOauthAuthorizeErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type ProviderOauthAuthorizeError = ProviderOauthAuthorizeErrors[keyof ProviderOauthAuthorizeErrors]

export type ProviderOauthAuthorizeResponses = {
  /**
   * 授权 URL 和方式
   */
  200: ProviderAuthAuthorization
}

export type ProviderOauthAuthorizeResponse = ProviderOauthAuthorizeResponses[keyof ProviderOauthAuthorizeResponses]

export type ProviderOauthCallbackData = {
  body?: {
    /**
     * 身份验证方式索引
     */
    method: number
    /**
     * OAuth 授权码
     */
    code?: string
  }
  path: {
    /**
     * 提供商 ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/provider/{id}/oauth/callback"
}

export type ProviderOauthCallbackErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type ProviderOauthCallbackError = ProviderOauthCallbackErrors[keyof ProviderOauthCallbackErrors]

export type ProviderOauthCallbackResponses = {
  /**
   * OAuth 回调已成功处理
   */
  200: boolean
}

export type ProviderOauthCallbackResponse = ProviderOauthCallbackResponses[keyof ProviderOauthCallbackResponses]

export type FindTextData = {
  body?: never
  path?: never
  query: {
    directory?: string
    pattern: string
  }
  url: "/find"
}

export type FindTextResponses = {
  /**
   * Matches
   */
  200: Array<{
    path: {
      text: string
    }
    lines: {
      text: string
    }
    line_number: number
    absolute_offset: number
    submatches: Array<{
      match: {
        text: string
      }
      start: number
      end: number
    }>
  }>
}

export type FindTextResponse = FindTextResponses[keyof FindTextResponses]

export type FindFilesData = {
  body?: never
  path?: never
  query: {
    directory?: string
    query: string
    dirs?: "true" | "false"
  }
  url: "/find/file"
}

export type FindFilesResponses = {
  /**
   * 文件路径
   */
  200: Array<string>
}

export type FindFilesResponse = FindFilesResponses[keyof FindFilesResponses]

export type FindSymbolsData = {
  body?: never
  path?: never
  query: {
    directory?: string
    query: string
  }
  url: "/find/symbol"
}

export type FindSymbolsResponses = {
  /**
   * Symbols
   */
  200: Array<Symbol>
}

export type FindSymbolsResponse = FindSymbolsResponses[keyof FindSymbolsResponses]

export type FileListData = {
  body?: never
  path?: never
  query: {
    directory?: string
    path: string
  }
  url: "/file"
}

export type FileListResponses = {
  /**
   * 文件和目录
   */
  200: Array<FileNode>
}

export type FileListResponse = FileListResponses[keyof FileListResponses]

export type FileReadData = {
  body?: never
  path?: never
  query: {
    directory?: string
    path: string
  }
  url: "/file/content"
}

export type FileReadResponses = {
  /**
   * 文件内容
   */
  200: FileContent
}

export type FileReadResponse = FileReadResponses[keyof FileReadResponses]

export type FileStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/file/status"
}

export type FileStatusResponses = {
  /**
   * 文件状态
   */
  200: Array<File>
}

export type FileStatusResponse = FileStatusResponses[keyof FileStatusResponses]

export type AppLogData = {
  body?: {
    /**
     * 日志条目的服务名称
     */
    service: string
    /**
     * 日志级别
     */
    level: "debug" | "info" | "error" | "warn"
    /**
     * 日志消息
     */
    message: string
    /**
     * 日志条目的额外元数据
     */
    extra?: {
      [key: string]: unknown
    }
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/log"
}

export type AppLogErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type AppLogError = AppLogErrors[keyof AppLogErrors]

export type AppLogResponses = {
  /**
   * 日志条目已成功写入
   */
  200: boolean
}

export type AppLogResponse = AppLogResponses[keyof AppLogResponses]

export type AppAgentsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/agent"
}

export type AppAgentsResponses = {
  /**
   * 代理列表
   */
  200: Array<Agent>
}

export type AppAgentsResponse = AppAgentsResponses[keyof AppAgentsResponses]

export type McpStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/mcp"
}

export type McpStatusResponses = {
  /**
   * MCP 服务器状态
   */
  200: {
    [key: string]: McpStatus
  }
}

export type McpStatusResponse = McpStatusResponses[keyof McpStatusResponses]

export type McpAddData = {
  body?: {
    name: string
    config: McpLocalConfig | McpRemoteConfig
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/mcp"
}

export type McpAddErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type McpAddError = McpAddErrors[keyof McpAddErrors]

export type McpAddResponses = {
  /**
   * MCP 服务器已成功添加
   */
  200: {
    [key: string]: McpStatus
  }
}

export type McpAddResponse = McpAddResponses[keyof McpAddResponses]

export type McpAuthRemoveData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth"
}

export type McpAuthRemoveErrors = {
  /**
   * 未找到
   */
  404: NotFoundError
}

export type McpAuthRemoveError = McpAuthRemoveErrors[keyof McpAuthRemoveErrors]

export type McpAuthRemoveResponses = {
  /**
   * OAuth 凭据已移除
   */
  200: {
    success: true
  }
}

export type McpAuthRemoveResponse = McpAuthRemoveResponses[keyof McpAuthRemoveResponses]

export type McpAuthStartData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth"
}

export type McpAuthStartErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type McpAuthStartError = McpAuthStartErrors[keyof McpAuthStartErrors]

export type McpAuthStartResponses = {
  /**
   * OAuth 流程已开始
   */
  200: {
    /**
     * 要在浏览器中打开以进行授权的 URL
     */
    authorizationUrl: string
  }
}

export type McpAuthStartResponse = McpAuthStartResponses[keyof McpAuthStartResponses]

export type McpAuthCallbackData = {
  body?: {
    /**
     * OAuth 回调中的授权码
     */
    code: string
  }
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth/callback"
}

export type McpAuthCallbackErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type McpAuthCallbackError = McpAuthCallbackErrors[keyof McpAuthCallbackErrors]

export type McpAuthCallbackResponses = {
  /**
   * OAuth 身份验证已完成
   */
  200: McpStatus
}

export type McpAuthCallbackResponse = McpAuthCallbackResponses[keyof McpAuthCallbackResponses]

export type McpAuthAuthenticateData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth/authenticate"
}

export type McpAuthAuthenticateErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
  /**
   * 未找到
   */
  404: NotFoundError
}

export type McpAuthAuthenticateError = McpAuthAuthenticateErrors[keyof McpAuthAuthenticateErrors]

export type McpAuthAuthenticateResponses = {
  /**
   * OAuth 身份验证已完成
   */
  200: McpStatus
}

export type McpAuthAuthenticateResponse = McpAuthAuthenticateResponses[keyof McpAuthAuthenticateResponses]

export type McpConnectData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/connect"
}

export type McpConnectResponses = {
  /**
   * MCP 服务器已成功连接
   */
  200: boolean
}

export type McpConnectResponse = McpConnectResponses[keyof McpConnectResponses]

export type McpDisconnectData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/disconnect"
}

export type McpDisconnectResponses = {
  /**
   * MCP 服务器已成功断开连接
   */
  200: boolean
}

export type McpDisconnectResponse = McpDisconnectResponses[keyof McpDisconnectResponses]

export type LspStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/lsp"
}

export type LspStatusResponses = {
  /**
   * LSP 服务器状态
   */
  200: Array<LspStatus>
}

export type LspStatusResponse = LspStatusResponses[keyof LspStatusResponses]

export type FormatterStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/formatter"
}

export type FormatterStatusResponses = {
  /**
   * 格式化程序状态
   */
  200: Array<FormatterStatus>
}

export type FormatterStatusResponse = FormatterStatusResponses[keyof FormatterStatusResponses]

export type TuiAppendPromptData = {
  body?: {
    text: string
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/append-prompt"
}

export type TuiAppendPromptErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type TuiAppendPromptError = TuiAppendPromptErrors[keyof TuiAppendPromptErrors]

export type TuiAppendPromptResponses = {
  /**
   * 提示已成功处理
   */
  200: boolean
}

export type TuiAppendPromptResponse = TuiAppendPromptResponses[keyof TuiAppendPromptResponses]

export type TuiOpenHelpData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-help"
}

export type TuiOpenHelpResponses = {
  /**
   * 帮助对话框已成功打开
   */
  200: boolean
}

export type TuiOpenHelpResponse = TuiOpenHelpResponses[keyof TuiOpenHelpResponses]

export type TuiOpenSessionsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-sessions"
}

export type TuiOpenSessionsResponses = {
  /**
   * 会话对话框已成功打开
   */
  200: boolean
}

export type TuiOpenSessionsResponse = TuiOpenSessionsResponses[keyof TuiOpenSessionsResponses]

export type TuiOpenThemesData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-themes"
}

export type TuiOpenThemesResponses = {
  /**
   * 主题对话框已成功打开
   */
  200: boolean
}

export type TuiOpenThemesResponse = TuiOpenThemesResponses[keyof TuiOpenThemesResponses]

export type TuiOpenModelsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-models"
}

export type TuiOpenModelsResponses = {
  /**
   * 模型对话框已成功打开
   */
  200: boolean
}

export type TuiOpenModelsResponse = TuiOpenModelsResponses[keyof TuiOpenModelsResponses]

export type TuiSubmitPromptData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/submit-prompt"
}

export type TuiSubmitPromptResponses = {
  /**
   * 提示已成功提交
   */
  200: boolean
}

export type TuiSubmitPromptResponse = TuiSubmitPromptResponses[keyof TuiSubmitPromptResponses]

export type TuiClearPromptData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/clear-prompt"
}

export type TuiClearPromptResponses = {
  /**
   * 提示已成功清除
   */
  200: boolean
}

export type TuiClearPromptResponse = TuiClearPromptResponses[keyof TuiClearPromptResponses]

export type TuiExecuteCommandData = {
  body?: {
    command: string
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/execute-command"
}

export type TuiExecuteCommandErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type TuiExecuteCommandError = TuiExecuteCommandErrors[keyof TuiExecuteCommandErrors]

export type TuiExecuteCommandResponses = {
  /**
   * 命令已成功执行
   */
  200: boolean
}

export type TuiExecuteCommandResponse = TuiExecuteCommandResponses[keyof TuiExecuteCommandResponses]

export type TuiShowToastData = {
  body?: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    /**
     * 持续时间（毫秒）
     */
    duration?: number
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/show-toast"
}

export type TuiShowToastResponses = {
  /**
   * 通知已成功显示
   */
  200: boolean
}

export type TuiShowToastResponse = TuiShowToastResponses[keyof TuiShowToastResponses]

export type TuiPublishData = {
  body?: EventTuiPromptAppend | EventTuiCommandExecute | EventTuiToastShow
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/publish"
}

export type TuiPublishErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type TuiPublishError = TuiPublishErrors[keyof TuiPublishErrors]

export type TuiPublishResponses = {
  /**
   * 事件已成功发布
   */
  200: boolean
}

export type TuiPublishResponse = TuiPublishResponses[keyof TuiPublishResponses]

export type TuiControlNextData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/control/next"
}

export type TuiControlNextResponses = {
  /**
   * 下一个 TUI 请求
   */
  200: {
    path: string
    body: unknown
  }
}

export type TuiControlNextResponse = TuiControlNextResponses[keyof TuiControlNextResponses]

export type TuiControlResponseData = {
  body?: unknown
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/control/response"
}

export type TuiControlResponseResponses = {
  /**
   * 响应已成功提交
   */
  200: boolean
}

export type TuiControlResponseResponse = TuiControlResponseResponses[keyof TuiControlResponseResponses]

export type AuthSetData = {
  body?: Auth
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/auth/{id}"
}

export type AuthSetErrors = {
  /**
   * 错误请求
   */
  400: BadRequestError
}

export type AuthSetError = AuthSetErrors[keyof AuthSetErrors]

export type AuthSetResponses = {
  /**
   * 身份验证凭据已成功设置
   */
  200: boolean
}

export type AuthSetResponse = AuthSetResponses[keyof AuthSetResponses]

export type EventSubscribeData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/event"
}

export type EventSubscribeResponses = {
  /**
   * 事件流
   */
  200: Event
}

export type EventSubscribeResponse = EventSubscribeResponses[keyof EventSubscribeResponses]

export type ClientOptions = {
  baseUrl: `${string}://${string}` | (string & {})
}
