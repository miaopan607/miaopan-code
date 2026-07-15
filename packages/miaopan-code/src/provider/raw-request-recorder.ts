import fs from "fs/promises"
import path from "path"
import { Global } from "@miaopan-code/core/global"

const REDACTED = "<redacted>"
const SENSITIVE_NAME_SOURCE =
  "authorization|api[-_]?key|access[-_]?token|refresh[-_]?token|id[-_]?token|token|secret|credential|signature"
const SENSITIVE_NAME = new RegExp(SENSITIVE_NAME_SOURCE, "i")
const SHORT_SENSITIVE_NAME = /^(key|sig)$/i
const REDACT_TEXT_FIELD = new RegExp(`((?:${SENSITIVE_NAME_SOURCE}|key|sig)\\s*[=:]\\s*)[^&\\s,}]+`, "gi")
const REDACT_JSON_FIELD = new RegExp(`("(?:${SENSITIVE_NAME_SOURCE}|key|sig)"\\s*:\\s*)"[^"]*"`, "gi")
const states = new Map<string, { pending: Promise<void>; sequence: number }>()

export interface RecordInput {
  readonly providerID: string
  readonly modelID: string
  readonly input: RequestInfo | URL
  readonly init?: RequestInit
}

export interface Recorder {
  readonly record: (input: RecordInput) => Promise<void>
}

export function make(input: { readonly file?: string; readonly onError?: (error: unknown) => void }): Recorder {
  const file = input.file ?? path.join(Global.Path.log, "llm-requests.jsonl")
  const state = states.get(file) ?? { pending: Promise.resolve(), sequence: 0 }
  states.set(file, state)

  return {
    record: (request) => {
      const sequence = ++state.sequence
      state.pending = state.pending
        .then(async () => {
          const entry = await serialize(request, sequence)
          await fs.appendFile(file, JSON.stringify(entry) + "\n")
        })
        .catch((error) => {
          try {
            input.onError?.(error)
          } catch {}
        })
      return state.pending
    },
  }
}

async function serialize(input: RecordInput, sequence: number) {
  const headers = new Headers(input.init?.headers ?? (input.input instanceof Request ? input.input.headers : undefined))
  const bodyText = await requestBody(input.input, input.init)
  return {
    time: new Date().toISOString(),
    pid: process.pid,
    runtime: "ai-sdk",
    providerID: input.providerID,
    modelID: input.modelID,
    sequence,
    method: input.init?.method ?? (input.input instanceof Request ? input.input.method : "GET"),
    url: redactUrl(input.input instanceof Request ? input.input.url : input.input.toString()),
    headers: redactHeaders(headers),
    body: bodyText === undefined ? undefined : redactBody(bodyText),
  }
}

async function requestBody(input: RequestInfo | URL, init: RequestInit | undefined) {
  if (init?.body !== undefined && init.body !== null) return bodyText(init.body)
  if (!(input instanceof Request)) return undefined
  if (input.method === "GET" || input.method === "HEAD" || input.body === null) return undefined
  return input.clone().text()
}

async function bodyText(body: BodyInit) {
  if (typeof body === "string") return body
  if (body instanceof URLSearchParams) return body.toString()
  if (body instanceof Blob) return body.text()
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(body)
  if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body)
  return undefined
}

function redactHeaders(headers: Headers) {
  return Object.fromEntries(
    Array.from(headers.entries()).map(([name, value]) => [name, sensitive(name) ? REDACTED : value]),
  )
}

function redactUrl(value: string) {
  if (!URL.canParse(value)) return value
  const url = new URL(value)
  url.searchParams.forEach((_, name) => {
    if (sensitive(name)) url.searchParams.set(name, REDACTED)
  })
  return url.toString()
}

function redactBody(value: string) {
  try {
    return redactValue(JSON.parse(value))
  } catch {
    return value.replace(REDACT_TEXT_FIELD, `$1${REDACTED}`).replace(REDACT_JSON_FIELD, `$1"${REDACTED}"`)
  }
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value).map(([name, item]) => [
      name,
      sensitive(name) && (item === null || typeof item !== "object" || Array.isArray(item))
        ? REDACTED
        : redactValue(item),
    ]),
  )
}

function sensitive(name: string) {
  return SENSITIVE_NAME.test(name) || SHORT_SENSITIVE_NAME.test(name)
}

export * as RawRequestRecorder from "./raw-request-recorder"
