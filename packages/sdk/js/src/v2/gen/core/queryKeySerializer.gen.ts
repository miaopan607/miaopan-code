// 此文件由 @hey-api/openapi-ts 自动生成

/**
 * 与 Pinia Colada 可哈希内容对应的 JSON 友好联合类型。
 */
export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue }

/**
 * 将非 JSON 值（bigint、Date 等）转换为安全替代值的 replacer。
 */
export const queryKeyJsonReplacer = (_key: string, value: unknown) => {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }
  if (typeof value === "bigint") {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

/**
 * 安全地将值字符串化，再解析回 JsonValue。
 */
export const stringifyToJsonValue = (input: unknown): JsonValue | undefined => {
  try {
    const json = JSON.stringify(input, queryKeyJsonReplacer)
    if (json === undefined) {
      return undefined
    }
    return JSON.parse(json) as JsonValue
  } catch {
    return undefined
  }
}

/**
 * 检测普通对象（包括原型为 null 的对象）。
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") {
    return false
  }
  const prototype = Object.getPrototypeOf(value as object)
  return prototype === Object.prototype || prototype === null
}

/**
 * 将 URLSearchParams 转换为排序后的 JSON 对象，以生成确定性 key。
 */
const serializeSearchParams = (params: URLSearchParams): JsonValue => {
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const result: Record<string, JsonValue> = {}

  for (const [key, value] of entries) {
    const existing = result[key]
    if (existing === undefined) {
      result[key] = value
      continue
    }

    if (Array.isArray(existing)) {
      ;(existing as string[]).push(value)
    } else {
      result[key] = [existing, value]
    }
  }

  return result
}

/**
 * 将任意可接受值规范化为查询 key 使用的 JSON 友好结构。
 */
export const serializeQueryKeyValue = (value: unknown): JsonValue | undefined => {
  if (value === null) {
    return null
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return stringifyToJsonValue(value)
  }

  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return serializeSearchParams(value)
  }

  if (isPlainObject(value)) {
    return stringifyToJsonValue(value)
  }

  return undefined
}
