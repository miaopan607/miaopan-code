const messages = {
  question_label: { "zh-CN": "显示文本（1-5 个词，简洁）", en: "Display text (1-5 words, concise)" },
  question_description: { "zh-CN": "选项说明", en: "Explanation of choice" },
  question_question: { "zh-CN": "完整问题", en: "Complete question" },
  question_header: { "zh-CN": "非常短的标签（最多 30 个字符）", en: "Very short label (max 30 chars)" },
  question_options: { "zh-CN": "可用选项", en: "Available choices" },
  question_multiple: { "zh-CN": "允许选择多个选项", en: "Allow selecting multiple choices" },
  question_custom: { "zh-CN": "允许输入自定义答案（默认：是）", en: "Allow typing a custom answer (default: true)" },
  question_questions: { "zh-CN": "要询问的问题", en: "Questions to ask" },
  question_answers: {
    "zh-CN": "按问题顺序排列的用户答案（每个答案是所选标签数组）",
    en: "User answers in order of questions (each answer is an array of selected labels)",
  },
  todo_content: { "zh-CN": "任务的简要说明", en: "Brief description of the task" },
  todo_status: {
    "zh-CN": "任务的当前状态：pending、in_progress、completed、cancelled",
    en: "Current status of the task: pending, in_progress, completed, cancelled",
  },
  todo_priority: { "zh-CN": "任务优先级：high、medium、low", en: "Priority level of the task: high, medium, low" },
  tui_duration: { "zh-CN": "以毫秒为单位的持续时间", en: "Duration in milliseconds" },
  tui_session_id: { "zh-CN": "要导航到的会话 ID", en: "Session ID to navigate to" },
  project_startup: {
    "zh-CN": "创建新工作区（工作树）时要运行的启动脚本",
    en: "Startup script to run when creating a new workspace (worktree)",
  },
  workspace_id_prefix: { "zh-CN": "ID {{id}} 不以 wrk 开头", en: "ID {{id}} does not start with wrk" },
  event_duplicate_latest: {
    "zh-CN": "最新事件定义重复：{{type}}",
    en: "Duplicate latest event definition for {{type}}",
  },
  event_duplicate_durable: {
    "zh-CN": "持久事件定义重复：{{key}}",
    en: "Duplicate durable event definition for {{key}}",
  },
} as const

export type Language = "zh-CN" | "en"
export type MessageKey = keyof typeof messages
export type MessageParameters = Record<string, string | number | undefined>
export const t = (language: Language | undefined, key: MessageKey, parameters: MessageParameters = {}) =>
  messages[key][language === "en" ? "en" : "zh-CN"].replace(/{{(\w+)}}/g, (_, name: string) =>
    String(parameters[name] ?? ""),
  )
export const zh = (key: MessageKey, parameters: MessageParameters = {}) => t("zh-CN", key, parameters)
