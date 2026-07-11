// 此文件由 @hey-api/openapi-ts 自动生成

// miaopan-code-runtime-i18n:sse

import { t, type Language } from "../../i18n.js"

import type { Config } from "./types.gen.js"

export type ServerSentEventsOptions<TData = unknown> = { language?: Language } & Omit<RequestInit, "method"> &
  Pick<Config, "method" | "responseTransformer" | "responseValidator"> & {
    /**
     * 流式传输期间发生网络或解析错误时调用的回调。
     *
     * 此选项仅适用于返回事件流的端点。
     *
     * @param error 发生的错误。
     */
    onSseError?: (error: unknown) => void
    /**
     * 服务器流式传输事件时调用的回调。
     *
     * 此选项仅适用于返回事件流的端点。
     *
     * @param event 服务器流式传输的事件。
     * @returns 无返回值（void）。
     */
    onSseEvent?: (event: StreamEvent<TData>) => void
    /**
     * 默认重试延迟（毫秒）。
     *
     * 此选项仅适用于返回事件流的端点。
     *
     * @default 3000
     */
    sseDefaultRetryDelay?: number
    /**
     * 放弃前的最大重试次数。
     */
    sseMaxRetryAttempts?: number
    /**
     * 最大重试延迟（毫秒）。
     *
     * 仅在使用指数退避时适用。
     *
     * 此选项仅适用于返回事件流的端点。
     *
     * @default 30000
     */
    sseMaxRetryDelay?: number
    /**
     * 用于重试退避的可选 sleep 函数。
     *
     * 默认使用 `setTimeout`。
     */
    sseSleepFn?: (ms: number) => Promise<void>
    url: string
  }

export interface StreamEvent<TData = unknown> {
  data: TData
  event?: string
  id?: string
  retry?: number
}

export type ServerSentEventsResult<TData = unknown, TReturn = void, TNext = unknown> = {
  stream: AsyncGenerator<TData extends Record<string, unknown> ? TData[keyof TData] : TData, TReturn, TNext>
}

export const createSseClient = <TData = unknown>({
  language,
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}: ServerSentEventsOptions): ServerSentEventsResult<TData> => {
  let lastEventId: string | undefined

  const sleep = sseSleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))

  const createStream = async function* () {
    let retryDelay: number = sseDefaultRetryDelay ?? 3000
    let attempt = 0
    const signal = options.signal ?? new AbortController().signal

    while (true) {
      if (signal.aborted) break

      attempt++

      const headers =
        options.headers instanceof Headers
          ? options.headers
          : new Headers(options.headers as Record<string, string> | undefined)

      if (lastEventId !== undefined) {
        headers.set("Last-Event-ID", lastEventId)
      }

      try {
        const response = await fetch(url, { ...options, headers, signal })

        if (!response.ok)
          throw new Error(
            t(language, "generated_sse_failed", { status: response.status, statusText: response.statusText }),
          )

        if (!response.body) throw new Error(t(language, "generated_sse_no_body"))

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()

        let buffer = ""

        const abortHandler = () => {
          try {
            void reader.cancel()
          } catch {
            // noop
          }
        }

        signal.addEventListener("abort", abortHandler)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += value

            const chunks = buffer.split("\n\n")
            buffer = chunks.pop() ?? ""

            for (const chunk of chunks) {
              const lines = chunk.split("\n")
              const dataLines: Array<string> = []
              let eventName: string | undefined

              for (const line of lines) {
                if (line.startsWith("data:")) {
                  dataLines.push(line.replace(/^data:\s*/, ""))
                } else if (line.startsWith("event:")) {
                  eventName = line.replace(/^event:\s*/, "")
                } else if (line.startsWith("id:")) {
                  lastEventId = line.replace(/^id:\s*/, "")
                } else if (line.startsWith("retry:")) {
                  const parsed = Number.parseInt(line.replace(/^retry:\s*/, ""), 10)
                  if (!Number.isNaN(parsed)) {
                    retryDelay = parsed
                  }
                }
              }

              let data: unknown
              let parsedJson = false

              if (dataLines.length) {
                const rawData = dataLines.join("\n")
                try {
                  data = JSON.parse(rawData)
                  parsedJson = true
                } catch {
                  data = rawData
                }
              }

              if (parsedJson) {
                if (responseValidator) {
                  await responseValidator(data)
                }

                if (responseTransformer) {
                  data = await responseTransformer(data)
                }
              }

              onSseEvent?.({
                data,
                event: eventName,
                id: lastEventId,
                retry: retryDelay,
              })

              if (dataLines.length) {
                yield data as any
              }
            }
          }
        } finally {
          signal.removeEventListener("abort", abortHandler)
          reader.releaseLock()
        }

        break // 正常完成时退出循环
      } catch (error) {
        // 连接失败或中止；延迟后重试
        onSseError?.(error)

        if (sseMaxRetryAttempts !== undefined && attempt >= sseMaxRetryAttempts) {
          break // 触发错误后停止
        }

        // 指数退避：每次尝试将重试延迟加倍，上限为 30 秒
        const backoff = Math.min(retryDelay * 2 ** (attempt - 1), sseMaxRetryDelay ?? 30000)
        await sleep(backoff)
      }
    }
  }

  const stream = createStream()

  return { stream }
}
