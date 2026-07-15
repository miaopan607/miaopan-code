import type { AssistantMessage, Part, Provider, UserMessage } from "@miaopan/sdk/v2"
import { Locale } from "./locale"
import * as Model from "./model"
import { t } from "@miaopan-code/core/i18n"
import { errorMessage } from "./error"
import { projectContinuationMessages, type MessageWithParts } from "./session-continuation"

export type TranscriptOptions = {
  thinking: boolean
  toolDetails: boolean
  assistantMetadata: boolean
  continuationRecords?: boolean
  providers?: Provider[]
}

export type SessionInfo = {
  id: string
  title: string
  time: {
    created: number
    updated: number
  }
}

export function formatTranscript(
  session: SessionInfo,
  messages: MessageWithParts[],
  options: TranscriptOptions,
): string {
  const providers = Model.index(options.providers)
  messages = options.continuationRecords ? messages : projectContinuationMessages(messages)
  let transcript = `# ${session.title}\n\n`
  transcript += `**${t(Locale.language(), "transcript.session_id")}:** ${session.id}\n`
  transcript += `**${t(Locale.language(), "transcript.created")}:** ${new Date(session.time.created).toLocaleString(Locale.language())}\n`
  transcript += `**${t(Locale.language(), "transcript.updated")}:** ${new Date(session.time.updated).toLocaleString(Locale.language())}\n\n`
  transcript += `---\n\n`

  for (const msg of messages) {
    transcript += formatMessage(msg.info, msg.parts, options, providers)
    transcript += `---\n\n`
  }

  return transcript
}

export function formatMessage(
  msg: UserMessage | AssistantMessage,
  parts: Part[],
  options: TranscriptOptions,
  providers?: Provider[] | ReadonlyMap<string, Provider>,
): string {
  let result = ""

  if (msg.role === "user") {
    result += `## ${t(Locale.language(), "transcript.user")}\n\n`
  } else {
    result += formatAssistantHeader(msg, options.assistantMetadata, providers ?? options.providers)
  }

  for (const part of parts) {
    result += formatPart(part, options)
  }

  if (msg.role === "assistant" && msg.error && options.continuationRecords) {
    result += `**${t(Locale.language(), "transcript.error")}:**\n\n${errorMessage(msg.error)}\n\n`
  }

  return result
}

export function formatAssistantHeader(
  msg: AssistantMessage,
  includeMetadata: boolean,
  providers?: Provider[] | ReadonlyMap<string, Provider>,
): string {
  if (!includeMetadata) {
    return `## ${t(Locale.language(), "transcript.assistant")}\n\n`
  }

  const duration =
    msg.time.completed && msg.time.created ? ((msg.time.completed - msg.time.created) / 1000).toFixed(1) + "s" : ""

  const modelName = Model.name(providers, msg.providerID, msg.modelID)

  return `## ${t(Locale.language(), "transcript.assistant")} (${Locale.titlecase(msg.agent)} · ${modelName}${duration ? ` · ${duration}` : ""})\n\n`
}

export function formatPart(part: Part, options: TranscriptOptions): string {
  if (part.type === "plan" || (part.type === "text" && !part.synthetic)) {
    return `${part.text}\n\n`
  }

  if (part.type === "reasoning") {
    if (options.thinking) {
      return `_${t(Locale.language(), "transcript.thinking")}:_\n\n${part.text}\n\n`
    }
    return ""
  }

  if (part.type === "tool") {
    let result = `**${t(Locale.language(), "transcript.tool")}: ${part.tool}**\n`
    if (options.toolDetails && part.state.input) {
      result += `\n**${t(Locale.language(), "transcript.input")}:**\n\`\`\`json\n${JSON.stringify(part.state.input, null, 2)}\n\`\`\`\n`
    }
    if (options.toolDetails && part.state.status === "completed" && part.state.output) {
      result += `\n**${t(Locale.language(), "transcript.output")}:**\n\`\`\`\n${part.state.output}\n\`\`\`\n`
    }
    if ((options.toolDetails || options.continuationRecords) && part.state.status === "error" && part.state.error) {
      result += `\n**${t(Locale.language(), "transcript.error")}:**\n\`\`\`\n${part.state.error}\n\`\`\`\n`
    }
    result += `\n`
    return result
  }

  return ""
}
