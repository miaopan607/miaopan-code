// 此文件由 @hey-api/openapi-ts 自动生成

// miaopan-code-runtime-i18n:path

import { t, type Language } from "../../i18n.js"

interface SerializeOptions<T> extends SerializePrimitiveOptions, SerializerOptions<T> {}

interface SerializePrimitiveOptions {
  language?: Language
  allowReserved?: boolean
  name: string
}

export interface SerializerOptions<T> {
  /**
   * @default true
   */
  explode: boolean
  style: T
}

export type ArrayStyle = "form" | "spaceDelimited" | "pipeDelimited"
export type ArraySeparatorStyle = ArrayStyle | MatrixStyle
type MatrixStyle = "label" | "matrix" | "simple"
export type ObjectStyle = "form" | "deepObject"
type ObjectSeparatorStyle = ObjectStyle | MatrixStyle

interface SerializePrimitiveParam extends SerializePrimitiveOptions {
  value: string
}

export const separatorArrayExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case "label":
      return "."
    case "matrix":
      return ";"
    case "simple":
      return ","
    default:
      return "&"
  }
}

export const separatorArrayNoExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case "form":
      return ","
    case "pipeDelimited":
      return "|"
    case "spaceDelimited":
      return "%20"
    default:
      return ","
  }
}

export const separatorObjectExplode = (style: ObjectSeparatorStyle) => {
  switch (style) {
    case "label":
      return "."
    case "matrix":
      return ";"
    case "simple":
      return ","
    default:
      return "&"
  }
}

export const serializeArrayParam = ({
  allowReserved,
  explode,
  language,
  name,
  style,
  value,
}: SerializeOptions<ArraySeparatorStyle> & {
  value: unknown[]
}) => {
  if (!explode) {
    const joinedValues = (allowReserved ? value : value.map((v) => encodeURIComponent(v as string))).join(
      separatorArrayNoExplode(style),
    )
    switch (style) {
      case "label":
        return `.${joinedValues}`
      case "matrix":
        return `;${name}=${joinedValues}`
      case "simple":
        return joinedValues
      default:
        return `${name}=${joinedValues}`
    }
  }

  const separator = separatorArrayExplode(style)
  const joinedValues = value
    .map((v) => {
      if (style === "label" || style === "simple") {
        return allowReserved ? v : encodeURIComponent(v as string)
      }

      return serializePrimitiveParam({
        allowReserved,
        language,
        name,
        value: v as string,
      })
    })
    .join(separator)
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues
}

export const serializePrimitiveParam = ({ allowReserved, language, name, value }: SerializePrimitiveParam) => {
  if (value === undefined || value === null) {
    return ""
  }

  if (typeof value === "object") {
    throw new Error(t(language, "generated_query_nested_unsupported"))
  }

  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`
}

export const serializeObjectParam = ({
  allowReserved,
  explode,
  language,
  name,
  style,
  value,
  valueOnly,
}: SerializeOptions<ObjectSeparatorStyle> & {
  value: Record<string, unknown> | Date
  valueOnly?: boolean
}) => {
  if (value instanceof Date) {
    return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`
  }

  if (style !== "deepObject" && !explode) {
    let values: string[] = []
    Object.entries(value).forEach(([key, v]) => {
      values = [...values, key, allowReserved ? (v as string) : encodeURIComponent(v as string)]
    })
    const joinedValues = values.join(",")
    switch (style) {
      case "form":
        return `${name}=${joinedValues}`
      case "label":
        return `.${joinedValues}`
      case "matrix":
        return `;${name}=${joinedValues}`
      default:
        return joinedValues
    }
  }

  const separator = separatorObjectExplode(style)
  const joinedValues = Object.entries(value)
    .map(([key, v]) =>
      serializePrimitiveParam({
        allowReserved,
        language,
        name: style === "deepObject" ? `${name}[${key}]` : key,
        value: v as string,
      }),
    )
    .join(separator)
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues
}
