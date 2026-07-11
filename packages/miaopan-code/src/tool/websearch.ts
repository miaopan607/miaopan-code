import { Effect, Schema } from "effect"
import { HttpClient } from "effect/unstable/http"
import * as Tool from "./tool"
import * as McpWebSearch from "./mcp-websearch"
import { ToolI18n } from "./i18n"
import { checksum } from "@miaopan-code/core/util/encode"
import { InstallationVersion } from "@miaopan-code/core/installation/version"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { t, type Language } from "@miaopan-code/core/i18n"

export function parameterSchema(language: Language = "zh-CN") {
  return Schema.Struct({
    query: Schema.String.annotate({ description: t(language, "tool.param.websearch_query") }),
    numResults: Schema.optional(Schema.Number).annotate({
      description: t(language, "tool.param.websearch_limit"),
    }),
    livecrawl: Schema.optional(Schema.Literals(["fallback", "preferred"])).annotate({
      description: t(language, "tool.param.core_livecrawl"),
    }),
    type: Schema.optional(Schema.Literals(["auto", "fast", "deep"])).annotate({
      description: t(language, "tool.param.websearch_type"),
    }),
    contextMaxCharacters: Schema.optional(Schema.Number).annotate({
      description: t(language, "tool.param.websearch_context"),
    }),
  })
}

export const Parameters = parameterSchema()

const WebSearchProviderSchema = Schema.Literals(["exa", "parallel"])
export type WebSearchProvider = Schema.Schema.Type<typeof WebSearchProviderSchema>

export function selectWebSearchProvider(sessionID: string, flags = { exa: false, parallel: false }): WebSearchProvider {
  const override = process.env.MIAOPAN_CODE_WEBSEARCH_PROVIDER
  if (override === "exa" || override === "parallel") return override
  if (flags.parallel) return "parallel"
  if (flags.exa) return "exa"

  return Number.parseInt(checksum(sessionID) ?? "0", 36) % 2 === 0 ? "exa" : "parallel"
}

export function webSearchProviderLabel(provider: unknown, language: Language = "zh-CN") {
  if (provider === "parallel") return t(language, "tui.web_search_parallel")
  if (provider === "exa") return t(language, "tui.web_search_exa")
  return t(language, "tui.web_search")
}

export function webSearchModelName(extra: Tool.Context["extra"]) {
  const model = extra?.model
  if (!model || typeof model !== "object") return undefined
  const api = "api" in model && model.api && typeof model.api === "object" ? model.api : undefined
  const apiID = api && "id" in api && typeof api.id === "string" ? api.id : undefined
  const id = "id" in model && typeof model.id === "string" ? model.id : undefined
  return (apiID ?? id)?.slice(0, 100)
}

function parallelAuthHeaders() {
  const headers = { "User-Agent": `miaopan-code/${InstallationVersion}` }
  if (!process.env.PARALLEL_API_KEY) return headers
  return { ...headers, Authorization: `Bearer ${process.env.PARALLEL_API_KEY}` }
}

function callProvider(
  http: HttpClient.HttpClient,
  provider: WebSearchProvider,
  params: Schema.Schema.Type<typeof Parameters>,
  ctx: Tool.Context,
) {
  if (provider === "parallel") {
    return McpWebSearch.call(
      http,
      McpWebSearch.PARALLEL_URL,
      "web_search",
      McpWebSearch.ParallelSearchArgs,
      {
        objective: params.query,
        search_queries: [params.query],
        session_id: ctx.sessionID,
        model_name: webSearchModelName(ctx.extra),
      },
      "25 seconds",
      parallelAuthHeaders(),
      ctx.language,
    )
  }

  return McpWebSearch.call(
    http,
    McpWebSearch.EXA_URL,
    "web_search_exa",
    McpWebSearch.SearchArgs,
    {
      query: params.query,
      type: params.type || "auto",
      numResults: params.numResults || 8,
      livecrawl: params.livecrawl || "fallback",
      contextMaxCharacters: params.contextMaxCharacters,
    },
    "25 seconds",
    undefined,
    ctx.language,
  )
}

export const WebSearchTool = Tool.define(
  "websearch",
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const flags = yield* RuntimeFlags.Service
    const language = yield* ToolI18n.language()
    const description = (yield* ToolI18n.description("tool.websearch")).replace(
      "{{year}}",
      new Date().getFullYear().toString(),
    )

    return {
      description,
      parameters: parameterSchema(language),
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const provider = selectWebSearchProvider(ctx.sessionID, {
            exa: flags.enableExa,
            parallel: flags.enableParallel,
          })
          const title = webSearchProviderLabel(provider, ctx.language)
          yield* ctx.metadata({
            title: ToolI18n.text(ctx, "tool.title.search", { title, query: params.query }),
            metadata: { provider },
          })

          yield* ctx.ask({
            permission: "websearch",
            patterns: [params.query],
            always: ["*"],
            metadata: {
              query: params.query,
              numResults: params.numResults,
              livecrawl: params.livecrawl,
              type: params.type,
              contextMaxCharacters: params.contextMaxCharacters,
              provider,
            },
          })

          const result = yield* callProvider(http, provider, params, ctx)

          return {
            output: result ?? ToolI18n.text(ctx, "tool.output.no_search_results"),
            title: ToolI18n.text(ctx, "tool.title.search", { title, query: params.query }),
            metadata: { provider },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
