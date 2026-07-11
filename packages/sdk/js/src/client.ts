export * from "./gen/types.gen.js"

import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { MiaopanCodeClient } from "./gen/sdk.gen.js"
import { wrapClientError } from "./error-interceptor.js"
import { resolveLanguage, type Language } from "./i18n.js"
export { type Config as MiaopanCodeClientConfig, MiaopanCodeClient }

function pick(value: string | null, fallback?: string) {
  if (!value) return
  if (!fallback) return value
  if (value === fallback) return fallback
  if (value === encodeURIComponent(fallback)) return fallback
  return value
}

function rewrite(request: Request, directory?: string) {
  if (request.method !== "GET" && request.method !== "HEAD") return request

  const value = pick(request.headers.get("x-miaopanCode-directory"), directory)
  if (!value) return request

  const url = new URL(request.url)
  if (!url.searchParams.has("directory")) {
    url.searchParams.set("directory", value)
  }

  const next = new Request(url, request)
  next.headers.delete("x-miaopanCode-directory")
  return next
}

export function createMiaopanCodeClient(config?: Config & { directory?: string; language?: Language }) {
  const language = resolveLanguage(config?.language)
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      // @ts-ignore
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  if (config?.directory) {
    config.headers = {
      ...config.headers,
      "x-miaopanCode-directory": encodeURIComponent(config.directory),
    }
  }

  const client = createClient(config)
  client.interceptors.request.use((request) => rewrite(request, config?.directory))
  client.interceptors.error.use((error, response, request, options) =>
    wrapClientError(error, response, request, options, language),
  )
  return new MiaopanCodeClient({ client })
}
