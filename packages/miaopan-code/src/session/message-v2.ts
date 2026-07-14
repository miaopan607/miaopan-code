import { SessionID, MessageID } from "./schema"
import { Language, t } from "@miaopan-code/core/i18n"
import { SessionV1 } from "@miaopan-code/core/v1/session"
import { ProviderV2 } from "@miaopan-code/core/provider"
import {
  APIError,
  AbortedError,
  Assistant,
  AuthError,
  CompactionPart,
  ContextOverflowError,
  Info,
  OutputLengthError,
  Part,
  SubtaskPart,
  User,
  WithParts,
} from "@miaopan-code/core/v1/session"

import { NamedError } from "@miaopan-code/core/util/error"
import {
  APICallError,
  convertToModelMessages,
  InvalidResponseDataError,
  InvalidToolInputError,
  JSONParseError,
  LoadAPIKeyError,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  TypeValidationError,
  type ModelMessage,
  type UIMessage,
} from "ai"
import { Database } from "@miaopan-code/core/database/database"
import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { NotFoundError } from "@/storage/storage"
import { and } from "drizzle-orm"
import { desc } from "drizzle-orm"
import { eq } from "drizzle-orm"
import { inArray } from "drizzle-orm"
import { lt } from "drizzle-orm"
import { or } from "drizzle-orm"
import { MessageTable, PartTable, SessionTable } from "@miaopan-code/core/session/sql"
import { ProviderError } from "@/provider/error"
import { SessionRetry } from "./retry"
import { LLMError } from "@miaopan-code/llm"
import { iife } from "@/util/iife"
import { errorMessage } from "@/util/error"
import { isMedia } from "@/util/media"
import type { SystemError } from "bun"
import type { Provider } from "@/provider/provider"
import { Effect, Schema } from "effect"

/** Error shape thrown by Bun's fetch() when gzip/br decompression fails mid-stream */
interface FetchDecompressionError extends Error {
  code: "ZlibError"
  errno: number
  path: string
}

export const SYNTHETIC_ATTACHMENT_PROMPT = t("en", "prompt.synthetic_attachment_heading")
export { isMedia }

export function syntheticAttachmentPrompt(language?: Language) {
  return t(language, "prompt.synthetic_attachment_heading")
}

export function isSyntheticAttachmentPrompt(text: string) {
  return Language.some((language) => text === syntheticAttachmentPrompt(language))
}

function orderSummaryParts(message: WithParts) {
  if (message.info.role !== "assistant" || message.info.summary !== true) return message.parts

  const synthetic = message.parts.filter((part) => part.type === "text" && part.synthetic === true)
  const parts = message.parts.filter((part) => part.type !== "text" || part.synthetic !== true)
  const firstText = parts.findIndex((part) => part.type === "text")
  if (synthetic.length === 0 || firstText === -1) return message.parts

  // Keep reasoning and tool order intact while moving history before summary text.
  return [...parts.slice(0, firstText), ...synthetic, ...parts.slice(firstText)]
}

function truncateToolOutput(text: string, maxChars?: number, language?: Language) {
  if (!maxChars || text.length <= maxChars) return text
  const omitted = text.length - maxChars
  return `${text.slice(0, maxChars)}\n${t(language, "prompt.tool_output_truncated", { chars: omitted })}`
}

export const Event = {
  Updated: SessionV1.Event.MessageUpdated,
  Removed: SessionV1.Event.MessageRemoved,
  PartUpdated: SessionV1.Event.PartUpdated,
  PartDelta: SessionV1.Event.PartDelta,
  PartRemoved: SessionV1.Event.PartRemoved,
}

const Cursor = Schema.Struct({
  id: MessageID,
  time: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
})
type Cursor = typeof Cursor.Type

const decodeCursor = Schema.decodeUnknownSync(Cursor)

export const cursor = {
  encode(input: Cursor) {
    return Buffer.from(JSON.stringify(input)).toString("base64url")
  },
  decode(input: string) {
    return decodeCursor(JSON.parse(Buffer.from(input, "base64url").toString("utf8")))
  },
}

const info = (row: typeof MessageTable.$inferSelect) =>
  ({
    ...row.data,
    id: row.id,
    sessionID: row.session_id,
  }) as Info

const part = (row: typeof PartTable.$inferSelect) =>
  ({
    ...row.data,
    id: row.id,
    sessionID: row.session_id,
    messageID: row.message_id,
  }) as Part

const older = (row: Cursor) =>
  or(lt(MessageTable.time_created, row.time), and(eq(MessageTable.time_created, row.time), lt(MessageTable.id, row.id)))

function hydrate(db: Database.Interface["db"], rows: (typeof MessageTable.$inferSelect)[]) {
  const ids = rows.map((row) => row.id)
  const partByMessage = new Map<string, Part[]>()
  return Effect.gen(function* () {
    if (ids.length > 0) {
      const partRows = yield* db
        .select()
        .from(PartTable)
        .where(inArray(PartTable.message_id, ids))
        .orderBy(PartTable.message_id, PartTable.id)
        .all()
        .pipe(Effect.orDie)
      for (const row of partRows) {
        const next = part(row)
        const list = partByMessage.get(row.message_id)
        if (list) list.push(next)
        else partByMessage.set(row.message_id, [next])
      }
    }

    return rows.map((row) => ({
      info: info(row),
      parts: partByMessage.get(row.id) ?? [],
    }))
  })
}

function providerMeta(metadata: Record<string, any> | undefined) {
  if (!metadata) return undefined
  const { providerExecuted: _, ...rest } = metadata
  return Object.keys(rest).length > 0 ? rest : undefined
}

export const toModelMessagesEffect = Effect.fnUntraced(function* (
  input: WithParts[],
  model: Provider.Model,
  options?: { stripMedia?: boolean; toolOutputMaxChars?: number; language?: Language },
) {
  const result: UIMessage[] = []
  const toolNames = new Set<string>()
  // Track media from tool results that need to be injected as user messages
  // for providers that don't support that media type in tool results.
  //
  // OpenAI-compatible APIs only support string content in tool results, so we need
  // to extract media and inject as user messages. Some SDKs only support a subset
  // of media in tool results; e.g. Bedrock supports images but not PDFs there.
  //
  // Only apply this workaround if the model actually supports that media input -
  // otherwise unsupportedParts() will turn it into a user-visible error.
  const supportsMediaInToolResult = (attachment: { mime: string }) => {
    if (model.api.npm === "@ai-sdk/anthropic") return true
    if (model.api.npm === "@ai-sdk/openai") return true
    if (model.api.npm === "@ai-sdk/amazon-bedrock/mantle") return true
    if (model.api.npm === "@ai-sdk/amazon-bedrock") return attachment.mime.startsWith("image/")
    if (model.api.npm === "@ai-sdk/xai") return attachment.mime.startsWith("image/")
    if (model.api.npm === "@ai-sdk/google-vertex/anthropic") return true
    if (model.api.npm === "@ai-sdk/google") {
      const id = model.api.id.toLowerCase()
      return id.includes("gemini-3") && !id.includes("gemini-2")
    }
    return false
  }

  const toModelOutput = (options: { toolCallId: string; input: unknown; output: unknown }) => {
    const output = options.output
    if (typeof output === "string") {
      return { type: "text", value: output }
    }

    if (typeof output === "object") {
      const outputObject = output as {
        text: string
        attachments?: Array<{ mime: string; url: string }>
      }
      const attachments = (outputObject.attachments ?? []).filter((attachment) => {
        return attachment.url.startsWith("data:") && attachment.url.includes(",")
      })

      return {
        type: "content",
        value: [
          ...(outputObject.text ? [{ type: "text", text: outputObject.text }] : []),
          ...attachments.map((attachment) => ({
            type: "media",
            mediaType: attachment.mime,
            data: iife(() => {
              const commaIndex = attachment.url.indexOf(",")
              return commaIndex === -1 ? attachment.url : attachment.url.slice(commaIndex + 1)
            }),
          })),
        ],
      }
    }

    return { type: "json", value: output as never }
  }

  for (const msg of input) {
    if (msg.parts.length === 0) continue

    if (msg.info.role === "user") {
      const userMessage: UIMessage = {
        id: msg.info.id,
        role: "user",
        parts: [],
      }
      for (const part of msg.parts) {
        // User message parts should never be empty
        if (part.type === "text" && !part.ignored && part.text !== "")
          userMessage.parts.push({
            type: "text",
            text: part.text,
          })
        // text/plain and directory files are converted into text parts, ignore them
        if (part.type === "file" && part.mime !== "text/plain" && part.mime !== "application/x-directory") {
          if (options?.stripMedia && isMedia(part.mime)) {
            userMessage.parts.push({
              type: "text",
              text: t(options?.language, "prompt.attachment_placeholder", {
                mime: part.mime,
                filename: part.filename ?? t(options?.language, "prompt.default_file_name"),
              }),
            })
          } else {
            userMessage.parts.push({
              type: "file",
              url: part.url,
              mediaType: part.mime,
              filename: part.filename,
            })
          }
        }

        if (part.type === "compaction") {
          userMessage.parts.push({
            type: "text",
            text: t(options?.language, "prompt.compaction_question"),
          })
        }
        if (part.type === "subtask") {
          userMessage.parts.push({
            type: "text",
            text: t(options?.language, "prompt.tool_executed_by_user"),
          })
        }
      }
      if (userMessage.parts.length > 0) result.push(userMessage)
    }

    if (msg.info.role === "assistant") {
      const differentModel = `${model.providerID}/${model.id}` !== `${msg.info.providerID}/${msg.info.modelID}`
      const media: Array<{ mime: string; url: string; filename?: string }> = []

      if (
        msg.info.error &&
        !(
          AbortedError.isInstance(msg.info.error) &&
          msg.parts.some((part) => part.type !== "step-start" && part.type !== "reasoning")
        )
      ) {
        continue
      }
      const assistantMessage: UIMessage = {
        id: msg.info.id,
        role: "assistant",
        parts: [],
      }
      // Anthropic adaptive thinking can persist assistant turns like:
      // step-start, reasoning(signature), text(""), step-start,
      // reasoning(signature). The empty text part is a structural separator,
      // but it does not carry the signature metadata itself. Dropping it shifts
      // signed thinking positions after step-start splitting/provider regrouping;
      // keeping it as "" is filtered by the AI SDK and rejected by Anthropic.
      // It is unclear whether this shape originates in our stream processing,
      // a proxy, or a lower-level library, but preserving a non-empty separator
      // here is the only safe replay point we have.
      // Use a single space so the separator survives replay without changing
      // the neighboring signed reasoning blocks.
      const hasSignedReasoning = msg.parts.some((part) => {
        if (part.type !== "reasoning") return false
        return part.metadata?.anthropic?.signature != null
      })
      for (const part of orderSummaryParts(msg)) {
        if (part.type === "text") {
          const text = part.text === "" && hasSignedReasoning ? " " : part.text
          assistantMessage.parts.push({
            type: "text",
            text,
            ...(differentModel ? {} : { providerMetadata: part.metadata }),
          })
        }
        if (part.type === "plan") {
          assistantMessage.parts.push({
            type: "text",
            text: `<proposed_plan>\n${part.text}${part.text.endsWith("\n") ? "" : "\n"}</proposed_plan>`,
            ...(differentModel ? {} : { providerMetadata: part.metadata }),
          })
        }
        if (part.type === "step-start")
          assistantMessage.parts.push({
            type: "step-start",
          })
        if (part.type === "tool") {
          toolNames.add(part.tool)
          if (part.state.status === "completed") {
            const outputText = part.state.time.compacted
              ? t(options?.language, "prompt.old_tool_result_cleared")
              : truncateToolOutput(part.state.output, options?.toolOutputMaxChars, options?.language)
            const attachments = part.state.time.compacted || options?.stripMedia ? [] : (part.state.attachments ?? [])

            // For providers that don't support media in tool results, extract media files
            // (images, PDFs) to be sent as a separate user message
            const mediaAttachments = attachments.filter((a) => isMedia(a.mime))
            const extractedMedia = mediaAttachments.filter((a) => !supportsMediaInToolResult(a))
            if (extractedMedia.length > 0) {
              media.push(...extractedMedia)
            }
            const finalAttachments = attachments.filter((a) => !isMedia(a.mime) || supportsMediaInToolResult(a))

            const output =
              finalAttachments.length > 0
                ? {
                    text: outputText,
                    attachments: finalAttachments,
                  }
                : outputText

            assistantMessage.parts.push({
              type: ("tool-" + part.tool) as `tool-${string}`,
              state: "output-available",
              toolCallId: part.callID,
              input: part.state.input,
              output,
              ...(part.metadata?.providerExecuted ? { providerExecuted: true } : {}),
              ...(differentModel ? {} : { callProviderMetadata: providerMeta(part.metadata) }),
            })
          }
          if (part.state.status === "error") {
            const output = part.state.metadata?.interrupted === true ? part.state.metadata.output : undefined
            if (typeof output === "string") {
              assistantMessage.parts.push({
                type: ("tool-" + part.tool) as `tool-${string}`,
                state: "output-available",
                toolCallId: part.callID,
                input: part.state.input,
                output,
                ...(part.metadata?.providerExecuted ? { providerExecuted: true } : {}),
                ...(differentModel ? {} : { callProviderMetadata: providerMeta(part.metadata) }),
              })
            } else {
              assistantMessage.parts.push({
                type: ("tool-" + part.tool) as `tool-${string}`,
                state: "output-error",
                toolCallId: part.callID,
                input: part.state.input,
                errorText: part.state.error,
                ...(part.metadata?.providerExecuted ? { providerExecuted: true } : {}),
                ...(differentModel ? {} : { callProviderMetadata: providerMeta(part.metadata) }),
              })
            }
          }
          // Handle pending/running tool calls to prevent dangling tool_use blocks
          // Anthropic/Claude APIs require every tool_use to have a corresponding tool_result
          if (part.state.status === "pending" || part.state.status === "running")
            assistantMessage.parts.push({
              type: ("tool-" + part.tool) as `tool-${string}`,
              state: "output-error",
              toolCallId: part.callID,
              input: part.state.input,
              errorText: t(options?.language, "prompt.tool_execution_interrupted"),
              ...(part.metadata?.providerExecuted ? { providerExecuted: true } : {}),
              ...(differentModel ? {} : { callProviderMetadata: providerMeta(part.metadata) }),
            })
        }
        if (part.type === "reasoning") {
          if (differentModel) {
            if (part.text.trim().length > 0)
              assistantMessage.parts.push({
                type: "text",
                text: part.text,
              })
            continue
          }
          assistantMessage.parts.push({
            type: "reasoning",
            text: part.text,
            providerMetadata: part.metadata,
          })
        }
      }
      if (assistantMessage.parts.length > 0) {
        result.push(assistantMessage)
        // Inject pending media as a user message for providers that don't support
        // media (images, PDFs) in tool results
        if (media.length > 0) {
          result.push({
            id: MessageID.ascending(),
            role: "user",
            parts: [
              {
                type: "text" as const,
                text: syntheticAttachmentPrompt(options?.language),
              },
              ...media.map((attachment) => ({
                type: "file" as const,
                url: attachment.url,
                mediaType: attachment.mime,
                filename: attachment.filename,
              })),
            ],
          })
        }
      }
    }
  }

  const tools = Object.fromEntries(Array.from(toolNames).map((toolName) => [toolName, { toModelOutput }]))

  return yield* Effect.promise(() =>
    convertToModelMessages(
      result.filter((msg) => msg.parts.some((part) => part.type !== "step-start")),
      {
        //@ts-expect-error (convertToModelMessages expects a ToolSet but only actually needs tools[name]?.toModelOutput)
        tools,
      },
    ),
  )
})

export function toModelMessages(
  input: WithParts[],
  model: Provider.Model,
  options?: { stripMedia?: boolean; toolOutputMaxChars?: number; language?: Language },
): Promise<ModelMessage[]> {
  return Effect.runPromise(toModelMessagesEffect(input, model, options))
}

export const page = Effect.fn("MessageV2.page")(function* (input: {
  sessionID: SessionID
  limit: number
  before?: string
  language?: Language
}) {
  const { db } = yield* Database.Service
  const before = input.before ? cursor.decode(input.before) : undefined
  const where = before
    ? and(eq(MessageTable.session_id, input.sessionID), older(before))
    : eq(MessageTable.session_id, input.sessionID)
  const rows = yield* db
    .select()
    .from(MessageTable)
    .where(where)
    .orderBy(desc(MessageTable.time_created), desc(MessageTable.id))
    .limit(input.limit + 1)
    .all()
    .pipe(Effect.orDie)
  if (rows.length === 0) {
    const row = yield* db
      .select({ id: SessionTable.id })
      .from(SessionTable)
      .where(eq(SessionTable.id, input.sessionID))
      .get()
      .pipe(Effect.orDie)
    if (!row)
      return yield* new NotFoundError({
        message: t(input.language, "error.session_not_found", { id: input.sessionID }),
      })
    return {
      items: [] as WithParts[],
      more: false,
    }
  }

  const more = rows.length > input.limit
  const slice = more ? rows.slice(0, input.limit) : rows
  const items = yield* hydrate(db, slice)
  items.reverse()
  const tail = slice.at(-1)
  return {
    items,
    more,
    cursor: more && tail ? cursor.encode({ id: tail.id, time: tail.time_created }) : undefined,
  }
})

export function stream(sessionID: SessionID) {
  const size = 50
  return Effect.gen(function* () {
    const result = [] as WithParts[]
    let before: string | undefined
    while (true) {
      const next = yield* page({ sessionID, limit: size, before }).pipe(
        Effect.catchIf(NotFoundError.isInstance, () =>
          Effect.succeed({ items: [] as WithParts[], more: false, cursor: undefined }),
        ),
      )
      if (next.items.length === 0) break
      for (let i = next.items.length - 1; i >= 0; i--) {
        const item = next.items[i]
        if (item) result.push(item)
      }
      if (!next.more || !next.cursor) break
      before = next.cursor
    }
    return result
  })
}

export function parts(messageID: MessageID) {
  return Effect.gen(function* () {
    const { db } = yield* Database.Service
    const rows = yield* db
      .select()
      .from(PartTable)
      .where(eq(PartTable.message_id, messageID))
      .orderBy(PartTable.id)
      .all()
      .pipe(Effect.orDie)
    return rows.map(part)
  })
}

export const get = Effect.fn("MessageV2.get")(function* (input: {
  sessionID: SessionID
  messageID: MessageID
  language?: Language
}) {
  const { db } = yield* Database.Service
  const row = yield* db
    .select()
    .from(MessageTable)
    .where(and(eq(MessageTable.id, input.messageID), eq(MessageTable.session_id, input.sessionID)))
    .get()
    .pipe(Effect.orDie)
  if (!row)
    return yield* new NotFoundError({ message: t(input.language, "error.message_not_found", { id: input.messageID }) })
  return {
    info: info(row),
    parts: yield* parts(input.messageID),
  }
})

export function filterCompacted(msgs: Iterable<WithParts>) {
  const result = [] as WithParts[]
  const completed = new Set<string>()
  let retain: MessageID | undefined
  for (const msg of msgs) {
    result.push(msg)
    if (retain) {
      if (msg.info.id === retain) break
      continue
    }
    if (msg.info.role === "user" && completed.has(msg.info.id)) {
      const part = msg.parts.find((item): item is CompactionPart => item.type === "compaction")
      if (!part) continue
      if (!part.tail_start_id) break
      retain = part.tail_start_id
      if (msg.info.id === retain) break
      continue
    }
    if (msg.info.role === "user" && completed.has(msg.info.id) && msg.parts.some((part) => part.type === "compaction"))
      break
    if (msg.info.role === "assistant" && msg.info.summary && msg.info.finish && !msg.info.error)
      completed.add(msg.info.parentID)
  }
  result.reverse()
  const compactionIndex = result.findLastIndex(
    (msg) =>
      msg.info.role === "user" &&
      msg.parts.some((item): item is CompactionPart => item.type === "compaction" && item.tail_start_id !== undefined),
  )
  const compaction = result[compactionIndex]
  const part = compaction?.parts.find(
    (item): item is CompactionPart => item.type === "compaction" && item.tail_start_id !== undefined,
  )
  const summaryIndex = compaction
    ? result.findIndex(
        (msg, index) =>
          index > compactionIndex &&
          msg.info.role === "assistant" &&
          msg.info.summary &&
          msg.info.parentID === compaction.info.id,
      )
    : -1
  const tailIndex = part?.tail_start_id ? result.findIndex((msg) => msg.info.id === part.tail_start_id) : -1
  if (tailIndex >= 0 && tailIndex < compactionIndex && summaryIndex > compactionIndex) {
    return [
      ...result.slice(compactionIndex, summaryIndex + 1),
      ...result.slice(tailIndex, compactionIndex),
      ...result.slice(summaryIndex + 1),
    ]
  }
  return result
}

export const filterCompactedEffect = Effect.fnUntraced(function* (sessionID: SessionID) {
  return filterCompacted(yield* stream(sessionID))
})

// filterCompacted reorders messages for model consumption
// ([compaction-user, summary, ...retained tail..., continue-user]), so array
// position is not chronological. Derive each binding by max id (MessageID
// is monotonic via MessageID.ascending) so a pre-compaction overflowing tail
// assistant doesn't get mistaken for the most recent turn. tasks are
// compaction/subtask parts attached to user messages newer than the latest
// finished assistant — i.e. unprocessed work.
export function latest(msgs: WithParts[]) {
  let user: User | undefined
  let assistant: Assistant | undefined
  let finished: Assistant | undefined
  for (const msg of msgs) {
    const info = msg.info
    if (info.role === "user" && (!user || info.id > user.id)) user = info
    if (info.role === "assistant" && (!assistant || info.id > assistant.id)) assistant = info
    if (info.role === "assistant" && info.finish && (!finished || info.id > finished.id)) finished = info
  }
  const tasks = msgs.flatMap((m) =>
    finished && m.info.id <= finished.id
      ? []
      : m.parts.filter((p): p is CompactionPart | SubtaskPart => p.type === "compaction" || p.type === "subtask"),
  )
  return { user, assistant, finished, tasks }
}

export function fromError(
  e: unknown,
  ctx: { providerID: ProviderV2.ID; aborted?: boolean; language?: Language },
): NonNullable<Assistant["error"]> {
  if (e instanceof LLMError) return fromLLMError(e)
  const apiError = APICallError.isInstance(e) ? e : findAPICallError(e)
  if (apiError) return fromAPICallCause(e, apiError, ctx)

  switch (true) {
    case e instanceof DOMException && e.name === "AbortError":
      return new AbortedError(
        { message: e.message },
        {
          cause: e,
        },
      ).toObject()
    case OutputLengthError.isInstance(e):
      return e
    case LoadAPIKeyError.isInstance(e):
      return new AuthError(
        {
          providerID: ctx.providerID,
          message: e.message,
        },
        { cause: e },
      ).toObject()
    case SessionRetry.StructuredOutputValidationError.isInstance(e):
      return structuredOutputError(e, e.responseBody)
    case e instanceof SessionRetry.HttpRetryError: {
      const parsed = fromError(e.cause, ctx)
      if (!APIError.isInstance(parsed)) return parsed
      return new APIError(
        {
          ...parsed.data,
          metadata: { ...parsed.data.metadata, phase: "http" },
        },
        { cause: e },
      ).toObject()
    }
    case e instanceof SessionRetry.ProviderStreamError:
      if (e.classification === "context-overflow") {
        return new ContextOverflowError({ message: e.message }, { cause: e }).toObject()
      }
      return new APIError(
        {
          message: e.message,
          isRetryable: e.retryable,
          metadata: { code: "PROVIDER_STREAM_ERROR", phase: "stream" },
        },
        { cause: e },
      ).toObject()
    case NoObjectGeneratedError.isInstance(e):
      return structuredOutputError(e, e.text)
    case TypeValidationError.isInstance(e):
      return structuredOutputError(e, serialize(e.value))
    case JSONParseError.isInstance(e):
      return new APIError(
        {
          message: withCause(e.message, e.cause),
          isRetryable: true,
          responseBody: e.text,
          metadata: { code: "JSON_PARSE_ERROR" },
        },
        { cause: e },
      ).toObject()
    case InvalidToolInputError.isInstance(e):
      return structuredOutputError(e, e.toolInput)
    case InvalidResponseDataError.isInstance(e):
      return new APIError(
        {
          message: withCause(e.message, e.data),
          isRetryable: true,
          responseBody: serialize(e.data),
          metadata: { code: "RESPONSE_PARSE_ERROR" },
        },
        { cause: e },
      ).toObject()
    case NoOutputGeneratedError.isInstance(e):
      return new APIError(
        {
          message: e.message,
          isRetryable: true,
          metadata: { code: "RESPONSE_EMPTY" },
        },
        { cause: e },
      ).toObject()
    case (e as SystemError)?.code === "ECONNRESET":
      return new APIError(
        {
          message: t(ctx.language, "error.connection_reset"),
          isRetryable: true,
          metadata: {
            code: (e as SystemError).code ?? "",
            syscall: (e as SystemError).syscall ?? "",
            message: (e as SystemError).message ?? "",
          },
        },
        { cause: e },
      ).toObject()
    case e instanceof Error && (e as FetchDecompressionError).code === "ZlibError":
      if (ctx.aborted) {
        return new AbortedError({ message: e.message }, { cause: e }).toObject()
      }
      return new APIError(
        {
          message: t(ctx.language, "error.response_decompression"),
          isRetryable: true,
          metadata: {
            code: (e as FetchDecompressionError).code,
            message: e.message,
          },
        },
        { cause: e },
      ).toObject()
    case e instanceof ProviderError.HeaderTimeoutError:
      return new APIError(
        {
          message: e.message,
          isRetryable: true,
          metadata: {
            code: "TIMEOUT",
            timeoutMs: String(e.ms),
          },
        },
        { cause: e },
      ).toObject()
    case e instanceof ProviderError.ResponseStreamError:
      return new APIError(
        {
          message: e.message,
          isRetryable: true,
          metadata: {
            code: "RESPONSE_STREAM_ERROR",
            phase: "stream",
            ...(e.transport ? { transport: e.transport } : {}),
          },
        },
        { cause: e },
      ).toObject()
    case e instanceof Error && networkError(e):
      return new APIError(
        {
          message: e.message,
          isRetryable: true,
          metadata: { code: errorCode(e) ?? "NETWORK_ERROR" },
        },
        { cause: e },
      ).toObject()
    case e instanceof Error:
      return new NamedError.Unknown({ message: errorMessage(e) }, { cause: e }).toObject()
    default:
      try {
        const parsed = ProviderError.parseStreamError(e, ctx.language)
        if (parsed) {
          if (parsed.type === "context_overflow") {
            return new ContextOverflowError(
              {
                message: parsed.message,
                responseBody: parsed.responseBody,
              },
              { cause: e },
            ).toObject()
          }
          return new APIError(
            {
              message: parsed.message,
              isRetryable: parsed.isRetryable,
              responseBody: parsed.responseBody,
            },
            {
              cause: e,
            },
          ).toObject()
        }
      } catch {}
      return new NamedError.Unknown({ message: JSON.stringify(e) }, { cause: e }).toObject()
  }
}

function structuredOutputError(error: Error, responseBody?: string) {
  return new APIError(
    {
      message: withCause(withCause(error.message, "cause" in error ? error.cause : undefined), responseBody),
      isRetryable: true,
      responseBody,
      metadata: { code: "STRUCTURED_OUTPUT_VALIDATION" },
    },
    { cause: error },
  ).toObject()
}

function findAPICallError(value: unknown, depth = 0): APICallError | undefined {
  if (depth > 3 || typeof value !== "object" || value === null) return undefined
  const cause = (value as { cause?: unknown }).cause
  if (APICallError.isInstance(cause)) return cause
  return cause === undefined ? undefined : findAPICallError(cause, depth + 1)
}

function fromAPICallCause(
  value: unknown,
  error: APICallError,
  ctx: { providerID: ProviderV2.ID; language?: Language },
) {
  const parsed = ProviderError.parseAPICallError({ providerID: ctx.providerID, error, language: ctx.language })
  if (parsed.type === "context_overflow") {
    return new ContextOverflowError(
      {
        message: parsed.message,
        responseBody: parsed.responseBody,
      },
      { cause: value },
    ).toObject()
  }

  const transport = findTransport(value)
  return new APIError(
    {
      message: value === error ? parsed.message : `${parsed.message}: ${errorMessage(value)}`,
      statusCode: parsed.statusCode,
      isRetryable: parsed.isRetryable,
      responseHeaders: parsed.responseHeaders,
      responseBody: parsed.responseBody,
      metadata: {
        ...parsed.metadata,
        ...(value instanceof SessionRetry.HttpRetryError ? { phase: "http" } : {}),
        ...(transport ? { transport } : {}),
      },
    },
    { cause: value },
  ).toObject()
}

function fromLLMError(error: LLMError) {
  const http = "http" in error.reason ? error.reason.http : undefined
  if (error.reason._tag === "InvalidRequest" && error.reason.classification === "context-overflow") {
    return new ContextOverflowError(
      { message: error.reason.message, responseBody: http?.body },
      { cause: error },
    ).toObject()
  }

  const statusCode = http?.response?.status ?? ("status" in error.reason ? error.reason.status : undefined)
  const retryable =
    error.reason._tag === "RateLimit" ||
    error.reason._tag === "ProviderInternal" ||
    error.reason._tag === "Transport" ||
    error.reason._tag === "InvalidProviderOutput"
  return new APIError(
    {
      message: error.reason.message,
      statusCode,
      isRetryable: retryable,
      responseHeaders: http?.response?.headers,
      responseBody: http?.body,
      metadata: {
        code: error.reason._tag,
        ...(error.phase ? { phase: error.phase } : {}),
        ...(error.transport ? { transport: error.transport } : {}),
      },
    },
    { cause: error },
  ).toObject()
}

function findTransport(value: unknown, depth = 0): "websocket" | undefined {
  if (depth > 5 || typeof value !== "object" || value === null) return undefined
  if (value instanceof ProviderError.ResponseStreamError && value.transport) return value.transport
  const cause = (value as { cause?: unknown }).cause
  return cause === undefined ? undefined : findTransport(cause, depth + 1)
}

function withCause(message: string, cause: unknown) {
  if (cause === undefined) return message
  const detail = serialize(cause)
  return detail && !message.includes(detail) ? `${message}: ${detail}` : message
}

function serialize(value: unknown) {
  if (value === undefined) return undefined
  if (typeof value === "string") return value
  if (value instanceof Error) return value.message
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function errorCode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined
  const code = (value as { code?: unknown }).code
  if (typeof code === "string") return code
  const cause = (value as { cause?: unknown }).cause
  return cause === undefined ? undefined : errorCode(cause)
}

function networkError(error: Error) {
  const code = errorCode(error)?.toLowerCase()
  if (
    code &&
    [
      "econnreset",
      "econnrefused",
      "enotfound",
      "eai_again",
      "etimedout",
      "econnaborted",
      "epipe",
      "und_err_socket",
    ].some((item) => code.includes(item))
  ) {
    return true
  }
  return /fetch failed|network error|connection (?:reset|refused|closed|aborted)|socket|timed out/i.test(error.message)
}

export * as MessageV2 from "./message-v2"
export const node = LayerNode.group([Database.node])
