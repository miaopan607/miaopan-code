// 此文件由 @hey-api/openapi-ts 自动生成

import type { Language } from "../../i18n.js"

import type { QuerySerializer } from "./bodySerializer.gen.js"
import {
  type ArraySeparatorStyle,
  serializeArrayParam,
  serializeObjectParam,
  serializePrimitiveParam,
} from "./pathSerializer.gen.js"

export interface PathSerializer {
  language?: Language
  path: Record<string, unknown>
  url: string
}

export const PATH_PARAM_RE = /\{[^{}]+\}/g

export const defaultPathSerializer = ({ language, path, url: _url }: PathSerializer) => {
  let url = _url
  const matches = _url.match(PATH_PARAM_RE)
  if (matches) {
    for (const match of matches) {
      let explode = false
      let name = match.substring(1, match.length - 1)
      let style: ArraySeparatorStyle = "simple"

      if (name.endsWith("*")) {
        explode = true
        name = name.substring(0, name.length - 1)
      }

      if (name.startsWith(".")) {
        name = name.substring(1)
        style = "label"
      } else if (name.startsWith(";")) {
        name = name.substring(1)
        style = "matrix"
      }

      const value = path[name]

      if (value === undefined || value === null) {
        continue
      }

      if (Array.isArray(value)) {
        url = url.replace(match, serializeArrayParam({ explode, name, style, value }))
        continue
      }

      if (typeof value === "object") {
        url = url.replace(
          match,
          serializeObjectParam({
            explode,
            name,
            style,
            value: value as Record<string, unknown>,
            valueOnly: true,
          }),
        )
        continue
      }

      if (style === "matrix") {
        url = url.replace(
          match,
          `;${serializePrimitiveParam({
            language,
            name,
            value: value as string,
          })}`,
        )
        continue
      }

      const replaceValue = encodeURIComponent(style === "label" ? `.${value as string}` : (value as string))
      url = url.replace(match, replaceValue)
    }
  }
  return url
}

export const getUrl = ({
  baseUrl,
  path,
  query,
  querySerializer,
  language,
  url: _url,
}: {
  baseUrl?: string
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  querySerializer: QuerySerializer
  language?: Language
  url: string
}) => {
  const pathUrl = _url.startsWith("/") ? _url : `/${_url}`
  let url = (baseUrl ?? "") + pathUrl
  if (path) {
    url = defaultPathSerializer({ language, path, url })
  }
  let search = query ? querySerializer(query) : ""
  if (search.startsWith("?")) {
    search = search.substring(1)
  }
  if (search) {
    url += `?${search}`
  }
  return url
}
