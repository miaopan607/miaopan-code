const messages = {
  example_tool_description: { "zh-CN": "这是一个自定义工具", en: "This is a custom tool" },
  example_tool_greeting: { "zh-CN": "你好，{{name}}！", en: "Hello {{name}}!" },
  folder_workspace_name: { "zh-CN": "文件夹", en: "Folder" },
  folder_workspace_description: { "zh-CN": "创建空白文件夹", en: "Create a blank folder" },
  publish_already_published: {
    "zh-CN": "已发布 {{name}}@{{version}}",
    en: "already published {{name}}@{{version}}",
  },
} as const

export type Language = "zh-CN" | "en"
export type MessageKey = keyof typeof messages
export type MessageParameters = Record<string, string | number | undefined>

export function resolveLanguage(input: unknown): Language {
  return input === "en" ? "en" : "zh-CN"
}

export function t(language: Language | undefined, key: MessageKey, parameters: MessageParameters = {}) {
  return messages[key][resolveLanguage(language)].replace(/{{(\w+)}}/g, (_, name: string) =>
    String(parameters[name] ?? ""),
  )
}

export const zh = (key: MessageKey, parameters: MessageParameters = {}) => t("zh-CN", key, parameters)
