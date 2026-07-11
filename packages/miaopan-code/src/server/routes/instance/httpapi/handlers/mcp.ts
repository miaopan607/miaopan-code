import { MCP } from "@/mcp"
import { Effect, Schema } from "effect"
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { McpServerNotFoundError } from "../errors"
import { AddPayload, AuthCallbackPayload, StatusMap, UnsupportedOAuthError } from "../groups/mcp"
import { t } from "../i18n"
import { requestLanguage } from "@miaopan-code/server/i18n"

export const mcpHandlers = HttpApiBuilder.group(InstanceHttpApi, "mcp", (handlers) =>
  Effect.gen(function* () {
    const mcp = yield* MCP.Service

    const status = Effect.fn("McpHttpApi.status")(function* () {
      return yield* mcp.status()
    })

    const add = Effect.fn("McpHttpApi.add")(function* (ctx: { payload: typeof AddPayload.Type }) {
      const result = (yield* mcp.add(ctx.payload.name, ctx.payload.config)).status
      return yield* Schema.decodeUnknownEffect(StatusMap)(
        "status" in result ? { [ctx.payload.name]: result } : result,
      ).pipe(Effect.mapError(() => new HttpApiError.BadRequest({})))
    })

    const authStart = Effect.fn("McpHttpApi.authStart")(function* (ctx: { params: { name: string } }) {
      const language = yield* requestLanguage()
      return yield* Effect.gen(function* () {
        if (!(yield* mcp.supportsOAuth(ctx.params.name))) {
          return yield* new UnsupportedOAuthError({
            error: t(language, "error.mcp_oauth_unsupported", { name: ctx.params.name }),
          })
        }
        return yield* mcp.startAuth(ctx.params.name)
      }).pipe(
        Effect.catchTag("MCP.NotFoundError", (error) =>
          Effect.fail(
            new McpServerNotFoundError({
              name: error.name,
              message: t(language, "error.mcp_not_found", { name: error.name }),
            }),
          ),
        ),
      )
    })

    const authCallback = Effect.fn("McpHttpApi.authCallback")(function* (ctx: {
      params: { name: string }
      payload: typeof AuthCallbackPayload.Type
    }) {
      const language = yield* requestLanguage()
      return yield* mcp.finishAuth(ctx.params.name, ctx.payload.code).pipe(
        Effect.catchTag("MCP.NotFoundError", (error) =>
          Effect.fail(
            new McpServerNotFoundError({
              name: error.name,
              message: t(language, "error.mcp_not_found", { name: error.name }),
            }),
          ),
        ),
      )
    })

    const authAuthenticate = Effect.fn("McpHttpApi.authAuthenticate")(function* (ctx: { params: { name: string } }) {
      const language = yield* requestLanguage()
      return yield* Effect.gen(function* () {
        if (!(yield* mcp.supportsOAuth(ctx.params.name))) {
          return yield* new UnsupportedOAuthError({
            error: t(language, "error.mcp_oauth_unsupported", { name: ctx.params.name }),
          })
        }
        return yield* mcp.authenticate(ctx.params.name)
      }).pipe(
        Effect.catchTag("MCP.NotFoundError", (error) =>
          Effect.fail(
            new McpServerNotFoundError({
              name: error.name,
              message: t(language, "error.mcp_not_found", { name: error.name }),
            }),
          ),
        ),
      )
    })

    const authRemove = Effect.fn("McpHttpApi.authRemove")(function* (ctx: { params: { name: string } }) {
      const language = yield* requestLanguage()
      const status = yield* mcp.status()
      if (!(ctx.params.name in status))
        return yield* new McpServerNotFoundError({
          name: ctx.params.name,
          message: t(language, "error.mcp_not_found", { name: ctx.params.name }),
        })
      yield* mcp.removeAuth(ctx.params.name)
      return { success: true as const }
    })

    const connect = Effect.fn("McpHttpApi.connect")(function* (ctx: { params: { name: string } }) {
      const language = yield* requestLanguage()
      yield* mcp.connect(ctx.params.name).pipe(
        Effect.catchTag("MCP.NotFoundError", (error) =>
          Effect.fail(
            new McpServerNotFoundError({
              name: error.name,
              message: t(language, "error.mcp_not_found", { name: error.name }),
            }),
          ),
        ),
      )
      return true
    })

    const disconnect = Effect.fn("McpHttpApi.disconnect")(function* (ctx: { params: { name: string } }) {
      const language = yield* requestLanguage()
      yield* mcp.disconnect(ctx.params.name).pipe(
        Effect.catchTag("MCP.NotFoundError", (error) =>
          Effect.fail(
            new McpServerNotFoundError({
              name: error.name,
              message: t(language, "error.mcp_not_found", { name: error.name }),
            }),
          ),
        ),
      )
      return true
    })

    return handlers
      .handle("status", status)
      .handle("add", add)
      .handle("authStart", authStart)
      .handle("authCallback", authCallback)
      .handle("authAuthenticate", authAuthenticate)
      .handle("authRemove", authRemove)
      .handle("connect", connect)
      .handle("disconnect", disconnect)
  }),
)
