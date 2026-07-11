import { Effect, Option, Schema, Stream } from "effect"
import { HttpClient, HttpClientRequest, HttpClientResponse, type HttpMethod } from "effect/unstable/http"
import { ToolError, toolError } from "../tool-error.js"
import { t, type Language } from "../i18n.js"
import { isRecord, own } from "./spec.js"
import type { AppliedAuth, Credential, Plan, SecurityScheme } from "./types.js"

const decodeJson = Schema.decodeUnknownOption(Schema.UnknownFromJsonString)
const maxErrorBodyChars = 1_024
const maxResponseBodyBytes = 50 * 1024 * 1024

export const invoke = (plan: Plan, input: unknown): Effect.Effect<unknown, unknown, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const value = isRecord(input) ? input : {}

    let request = yield* buildRequest(plan, value)

    const auth = yield* resolveAuth(plan)
    for (const [name, item] of Object.entries(auth.query)) {
      request = HttpClientRequest.setUrlParam(request, name, item)
    }
    request = HttpClientRequest.setHeaders(request, auth.headers)

    const client = yield* HttpClient.HttpClient
    const response = yield* client.execute(request).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          toolError(
            t(plan.language, "codemode.openapi.transport_error", {
              method: plan.operation.method,
              path: plan.operation.path,
            }),
            cause,
          ),
        ),
      ),
    )
    const text = yield* readResponseBody(response, plan)
    const mediaType = response.headers["content-type"]?.split(";")[0]?.trim().toLowerCase()
    const json = mediaType === "application/json" || mediaType?.endsWith("+json") === true
    const decoded = text === "" ? Option.some(null) : json ? decodeJson(text) : Option.none()
    const parsed = json ? Option.getOrElse(decoded, () => text) : text === "" ? null : text
    if (response.status < 200 || response.status >= 300) {
      const rendered = typeof parsed === "string" ? parsed : (JSON.stringify(parsed) ?? "")
      const summary =
        rendered === "" || rendered === "null"
          ? t(plan.language, "codemode.openapi.no_response_body")
          : rendered.length > maxErrorBodyChars
            ? `${rendered.slice(0, maxErrorBodyChars)}...`
            : rendered
      return yield* Effect.fail(
        toolError(
          t(plan.language, "codemode.openapi.http_error", {
            method: plan.operation.method,
            path: plan.operation.path,
            status: response.status,
            summary,
          }),
        ),
      )
    }
    if (json && Option.isNone(decoded)) {
      return yield* Effect.fail(
        toolError(
          t(plan.language, "codemode.openapi.malformed_json", {
            method: plan.operation.method,
            path: plan.operation.path,
          }),
        ),
      )
    }
    return parsed
  })

const buildRequest = (
  plan: Plan,
  input: Readonly<Record<string, unknown>>,
): Effect.Effect<HttpClientRequest.HttpClientRequest, ToolError> =>
  Effect.gen(function* () {
    // Validate every model-controlled value before auth resolution, which may refresh tokens.
    const url = buildUrl(plan, input)
    if (url instanceof ToolError) return yield* Effect.fail(url)
    const missing = plan.fields.find(
      (field) => field.required && field.location !== "path" && own(input, field.inputName) === undefined,
    )
    if (missing !== undefined) {
      return yield* Effect.fail(
        toolError(
          missing.location === "body"
            ? t(plan.language, "codemode.openapi.missing_required_body_field", { name: missing.inputName })
            : t(plan.language, "codemode.openapi.missing_required_parameter", {
                location: missing.location,
                name: missing.inputName,
              }),
        ),
      )
    }

    let request = HttpClientRequest.make(plan.operation.method as HttpMethod.HttpMethod)(url)
    for (const field of plan.fields) {
      if (field.location !== "query") continue
      const item = own(input, field.inputName)
      if (item === undefined) continue
      const serialized = serializeQuery(request, field, item, plan.language)
      if (serialized instanceof ToolError) return yield* Effect.fail(serialized)
      request = serialized
    }

    // Host headers first, then declared header parameters.
    request = HttpClientRequest.setHeaders(request, plan.headers)
    for (const field of plan.fields) {
      if (field.location !== "header") continue
      const item = own(input, field.inputName)
      if (item === undefined) continue
      const serialized = serializeSimple(field, item, String, plan.language)
      if (serialized instanceof ToolError) return yield* Effect.fail(serialized)
      request = HttpClientRequest.setHeader(request, field.name, serialized)
    }

    const setBody = (value: unknown, mediaType: string) =>
      HttpClientRequest.bodyJson(request, value).pipe(
        Effect.map((next) => HttpClientRequest.setHeader(next, "content-type", mediaType)),
        Effect.mapError((cause) =>
          toolError(
            t(plan.language, "codemode.openapi.invalid_json_body", {
              method: plan.operation.method,
              path: plan.operation.path,
            }),
            cause,
          ),
        ),
      )
    if (plan.body?.mode === "value") {
      const field = plan.fields.find((field) => field.location === "body")
      const body = field === undefined ? undefined : own(input, field.inputName)
      if (body !== undefined) request = yield* setBody(body, plan.body.mediaType)
    }
    if (plan.body?.mode === "object") {
      const entries = plan.fields.flatMap((field) => {
        if (field.location !== "body") return []
        const item = own(input, field.inputName)
        return item === undefined ? [] : [[field.name, item] as const]
      })
      if (plan.body.required || entries.length > 0) {
        request = yield* setBody(Object.fromEntries(entries), plan.body.mediaType)
      }
    }
    return request
  })

const resolveAuth = (plan: Plan): Effect.Effect<AppliedAuth, unknown> =>
  Effect.gen(function* () {
    const none: AppliedAuth = { headers: {}, query: {} }
    if (plan.security.length === 0) return none

    const unavailable: Array<string> = []
    alternatives: for (const requirement of plan.security) {
      const names = Object.keys(requirement)
      if (names.length === 0) return none
      const credentials: Array<readonly [string, SecurityScheme, Credential]> = []
      for (const name of names) {
        const scheme = own(plan.schemes, name)
        if (scheme === undefined || plan.auth === undefined) {
          unavailable.push(name)
          continue alternatives
        }
        const credential = yield* plan.auth.resolve({
          name,
          definition: scheme,
          scopes: requirement[name] ?? [],
          operation: plan.operation,
        })
        if (credential === undefined) {
          unavailable.push(name)
          continue alternatives
        }
        credentials.push([name, scheme, credential])
      }
      const applied = applyCredentials(credentials, plan.language)
      return applied instanceof ToolError ? yield* Effect.fail(applied) : applied
    }

    return yield* Effect.fail(
      toolError(
        t(plan.language, "codemode.openapi.authentication_required", {
          method: plan.operation.method,
          path: plan.operation.path,
          names: [...new Set(unavailable)].join(", "),
        }),
      ),
    )
  })

const applyCredentials = (
  credentials: ReadonlyArray<readonly [string, SecurityScheme, Credential]>,
  language?: Language,
): AppliedAuth | ToolError => {
  const headers = new Map<string, string>()
  const query = new Map<string, string>()
  const add = (carrier: "header" | "query", name: string, value: string): ToolError | undefined => {
    const target = carrier === "header" ? headers : query
    if (target.has(name)) return toolError(t(language, "codemode.openapi.duplicate_authentication", { carrier, name }))
    target.set(name, value)
  }
  for (const [name, definition, credential] of credentials) {
    if (credential.type === "bearer") {
      const duplicate = add("header", "authorization", `Bearer ${credential.token}`)
      if (duplicate !== undefined) return duplicate
      continue
    }
    if (credential.type === "basic") {
      // Buffer instead of btoa: btoa throws on non-Latin-1 credentials.
      const duplicate = add(
        "header",
        "authorization",
        `Basic ${Buffer.from(`${credential.username}:${credential.password}`, "utf8").toString("base64")}`,
      )
      if (duplicate !== undefined) return duplicate
      continue
    }
    if (credential.type === "header") {
      const duplicate = add("header", credential.name.toLowerCase(), credential.value)
      if (duplicate !== undefined) return duplicate
      continue
    }
    // apiKey: the carrier comes from the scheme declaration.
    if (definition.type !== "apiKey") {
      return toolError(t(language, "codemode.openapi.invalid_api_key_scheme", { name }))
    }
    if (definition.in === "cookie") return toolError(t(language, "codemode.openapi.cookie_auth_unsupported", { name }))
    const parameter = definition.in === "header" ? definition.name.toLowerCase() : definition.name
    const duplicate = add(definition.in, parameter, credential.value)
    if (duplicate !== undefined) return duplicate
  }
  return { headers: Object.fromEntries(headers), query: Object.fromEntries(query) }
}

const buildUrl = (plan: Plan, input: Readonly<Record<string, unknown>>): string | ToolError => {
  let url = plan.url
  for (const field of plan.fields) {
    if (field.location !== "path") continue
    const item = own(input, field.inputName)
    if (item === undefined) {
      return toolError(t(plan.language, "codemode.openapi.missing_path_parameter", { name: field.inputName }))
    }
    const fieldValue = serializeSimple(
      field,
      item,
      (value) =>
        encodeURIComponent(value).replace(
          /[!'()*]/g,
          (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
        ),
      plan.language,
    )
    if (fieldValue instanceof ToolError) return fieldValue
    // '.'/'..' survive encoding and URL normalization collapses them, letting a
    // model-supplied value retarget the request to a different endpoint.
    if (fieldValue === "" || fieldValue === "." || fieldValue === "..") {
      return toolError(t(plan.language, "codemode.openapi.invalid_path_parameter", { name: field.inputName }))
    }
    url = url.replaceAll(`{${field.name}}`, fieldValue)
  }
  const unresolved = url.match(/\{[^{}]+\}/)
  if (unresolved !== null)
    return toolError(t(plan.language, "codemode.openapi.unresolved_path_parameter", { name: unresolved[0] }))
  return url
}

const serializeSimple = (
  field: Plan["fields"][number],
  value: unknown,
  encode: (value: string) => string,
  language?: Language,
): string | ToolError => {
  const scalar = (item: unknown): string | ToolError =>
    item !== null && typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean"
      ? toolError(t(language, "codemode.openapi.parameter_nested_unsupported", { name: field.inputName }))
      : encode(String(item))
  if (Array.isArray(value)) {
    const items = value.map(scalar)
    const invalid = items.find((item): item is ToolError => item instanceof ToolError)
    return invalid ?? items.join(",")
  }
  if (!isRecord(value)) return scalar(value)
  const entries = Object.entries(value).flatMap<string | ToolError>(([name, item]) => {
    const rendered = scalar(item)
    if (rendered instanceof ToolError) return [rendered]
    return field.explode ? [`${encode(name)}=${rendered}`] : [encode(name), rendered]
  })
  const invalid = entries.find((item): item is ToolError => item instanceof ToolError)
  return invalid ?? entries.join(",")
}

const serializeQuery = (
  request: HttpClientRequest.HttpClientRequest,
  field: Plan["fields"][number],
  value: unknown,
  language?: Language,
): HttpClientRequest.HttpClientRequest | ToolError => {
  if (field.style === "deepObject") {
    if (!isRecord(value))
      return toolError(t(language, "codemode.openapi.deep_object_requires_object", { name: field.inputName }))
    return Object.entries(value).reduce<HttpClientRequest.HttpClientRequest | ToolError>((current, [name, item]) => {
      if (current instanceof ToolError) return current
      if (item === undefined || (item !== null && typeof item === "object")) {
        return toolError(t(language, "codemode.openapi.deep_object_nested_unsupported", { name: field.inputName }))
      }
      return HttpClientRequest.appendUrlParam(current, `${field.name}[${name}]`, String(item))
    }, request)
  }
  if (Array.isArray(value)) {
    const rendered = serializeSimple(field, value, String, language)
    if (rendered instanceof ToolError) return rendered
    if (!field.explode) return HttpClientRequest.appendUrlParam(request, field.name, rendered)
    if (value.some((item) => item === undefined || (item !== null && typeof item === "object"))) {
      return toolError(t(language, "codemode.openapi.query_nested_unsupported", { name: field.inputName }))
    }
    return value.reduce((current, item) => HttpClientRequest.appendUrlParam(current, field.name, String(item)), request)
  }
  if (isRecord(value) && field.explode) {
    return Object.entries(value).reduce<HttpClientRequest.HttpClientRequest | ToolError>((current, [name, item]) => {
      if (current instanceof ToolError) return current
      if (item === undefined || (item !== null && typeof item === "object")) {
        return toolError(t(language, "codemode.openapi.query_nested_unsupported", { name: field.inputName }))
      }
      return HttpClientRequest.appendUrlParam(current, name, String(item))
    }, request)
  }
  const rendered = serializeSimple(field, value, String, language)
  return rendered instanceof ToolError ? rendered : HttpClientRequest.appendUrlParam(request, field.name, rendered)
}

const readResponseBody = (
  response: HttpClientResponse.HttpClientResponse,
  plan: Plan,
): Effect.Effect<string, ToolError> =>
  Effect.gen(function* () {
    const contentLength = response.headers["content-length"]
    const parsedSize = contentLength === undefined ? undefined : Number.parseInt(contentLength, 10)
    const declaredSize =
      parsedSize !== undefined && Number.isSafeInteger(parsedSize) && parsedSize >= 0 ? parsedSize : undefined
    if (declaredSize !== undefined && declaredSize > maxResponseBodyBytes) {
      return yield* Effect.fail(
        toolError(
          t(plan.language, "codemode.openapi.response_too_large", {
            method: plan.operation.method,
            path: plan.operation.path,
          }),
        ),
      )
    }
    let body = Buffer.allocUnsafe(Math.min(maxResponseBodyBytes, declaredSize ?? 64 * 1024))
    let size = 0
    yield* Stream.runForEach(response.stream, (chunk) => {
      if (size + chunk.byteLength > maxResponseBodyBytes) {
        return Effect.fail(
          toolError(
            t(plan.language, "codemode.openapi.response_too_large", {
              method: plan.operation.method,
              path: plan.operation.path,
            }),
          ),
        )
      }
      if (size + chunk.byteLength > body.byteLength) {
        const grown = Buffer.allocUnsafe(
          Math.min(maxResponseBodyBytes, Math.max(size + chunk.byteLength, body.byteLength * 2)),
        )
        body.copy(grown, 0, 0, size)
        body = grown
      }
      body.set(chunk, size)
      size += chunk.byteLength
      return Effect.void
    }).pipe(
      Effect.catch((cause) => {
        if (cause instanceof ToolError) return Effect.fail(cause)
        if (cause.reason._tag === "EmptyBodyError") return Effect.void
        return Effect.fail(
          toolError(
            t(plan.language, "codemode.openapi.response_read_failed", {
              method: plan.operation.method,
              path: plan.operation.path,
            }),
            cause,
          ),
        )
      }),
    )
    return new TextDecoder().decode(body.subarray(0, size))
  })
