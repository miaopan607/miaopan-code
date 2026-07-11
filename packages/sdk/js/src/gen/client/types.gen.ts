// 此文件由 @hey-api/openapi-ts 自动生成

import type { Auth } from "../core/auth.gen.js"
import type { ServerSentEventsOptions, ServerSentEventsResult } from "../core/serverSentEvents.gen.js"
import type { Client as CoreClient, Config as CoreConfig } from "../core/types.gen.js"
import type { Middleware } from "./utils.gen.js"

export type ResponseStyle = "data" | "fields"

export interface Config<T extends ClientOptions = ClientOptions>
  extends Omit<RequestInit, "body" | "headers" | "method">,
    CoreConfig {
  /**
   * 此客户端发出的所有请求的基础 URL。
   */
  baseUrl?: T["baseUrl"]
  /**
   * Fetch API 实现。可使用此选项提供自定义 fetch 实例。
   *
   * @default globalThis.fetch
   */
  fetch?: (request: Request) => ReturnType<typeof fetch>
  /**
   * 请勿在 Next.js 应用中使用 Fetch 客户端；`next` 选项不会生效。
   *
   * 请改为安装 {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`}。
   */
  next?: never
  /**
   * 按指定格式解析并返回响应数据。默认情况下，`auto` 会根据响应的 `Content-Type` 标头推断适当的方法。可使用任意 {@link Body} 方法覆盖此行为。如果完全不想解析响应数据，请选择 `stream`。
   *
   * @default 'auto'
   */
  parseAs?: "arrayBuffer" | "auto" | "blob" | "formData" | "json" | "stream" | "text"
  /**
   * 只返回数据，还是返回多个字段（data、error、response 等）？
   *
   * @default 'fields'
   */
  responseStyle?: ResponseStyle
  /**
   * 是否抛出错误，而不是在响应中返回错误？
   *
   * @default false
   */
  throwOnError?: T["throwOnError"]
}

export interface RequestOptions<
  TData = unknown,
  TResponseStyle extends ResponseStyle = "fields",
  ThrowOnError extends boolean = boolean,
  Url extends string = string,
> extends Config<{
      responseStyle: TResponseStyle
      throwOnError: ThrowOnError
    }>,
    Pick<
      ServerSentEventsOptions<TData>,
      "onSseError" | "onSseEvent" | "sseDefaultRetryDelay" | "sseMaxRetryAttempts" | "sseMaxRetryDelay"
    > {
  /**
   * 要添加到请求中的任意正文。
   *
   * {@link https://developer.mozilla.org/docs/Web/API/fetch#body}
   */
  body?: unknown
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  /**
   * 请求使用的安全机制。
   */
  security?: ReadonlyArray<Auth>
  url: Url
}

export interface ResolvedRequestOptions<
  TResponseStyle extends ResponseStyle = "fields",
  ThrowOnError extends boolean = boolean,
  Url extends string = string,
> extends RequestOptions<unknown, TResponseStyle, ThrowOnError, Url> {
  serializedBody?: string
}

export type RequestResult<
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = boolean,
  TResponseStyle extends ResponseStyle = "fields",
> = ThrowOnError extends true
  ? Promise<
      TResponseStyle extends "data"
        ? TData extends Record<string, unknown>
          ? TData[keyof TData]
          : TData
        : {
            data: TData extends Record<string, unknown> ? TData[keyof TData] : TData
            request: Request
            response: Response
          }
    >
  : Promise<
      TResponseStyle extends "data"
        ? (TData extends Record<string, unknown> ? TData[keyof TData] : TData) | undefined
        : (
            | {
                data: TData extends Record<string, unknown> ? TData[keyof TData] : TData
                error: undefined
              }
            | {
                data: undefined
                error: TError extends Record<string, unknown> ? TError[keyof TError] : TError
              }
          ) & {
            request: Request
            response: Response
          }
    >

export interface ClientOptions {
  baseUrl?: string
  responseStyle?: ResponseStyle
  throwOnError?: boolean
}

type MethodFnBase = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">,
) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>

type MethodFnServerSentEvents = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">,
) => Promise<ServerSentEventsResult<TData, TError>>

type MethodFn = MethodFnBase & {
  sse: MethodFnServerSentEvents
}

type RequestFn = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method"> &
    Pick<Required<RequestOptions<TData, TResponseStyle, ThrowOnError>>, "method">,
) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>

type BuildUrlFn = <
  TData extends {
    body?: unknown
    path?: Record<string, unknown>
    query?: Record<string, unknown>
    url: string
  },
>(
  options: Pick<TData, "url"> & Options<TData>,
) => string

export type Client = CoreClient<RequestFn, Config, MethodFn, BuildUrlFn> & {
  interceptors: Middleware<Request, Response, unknown, ResolvedRequestOptions>
}

/**
 * `createClientConfig()` 函数会在客户端初始化时调用，返回的对象将成为客户端的初始配置。
 *
 * 你可能希望通过这种方式初始化客户端，而不是调用 `setConfig()`。例如在使用 Next.js 时，这有助于确保客户端始终具有正确的值。
 */
export type CreateClientConfig<T extends ClientOptions = ClientOptions> = (
  override?: Config<ClientOptions & T>,
) => Config<Required<ClientOptions> & T>

export interface TDataShape {
  body?: unknown
  headers?: unknown
  path?: unknown
  query?: unknown
  url: string
}

type OmitKeys<T, K> = Pick<T, Exclude<keyof T, K>>

export type Options<
  TData extends TDataShape = TDataShape,
  ThrowOnError extends boolean = boolean,
  TResponse = unknown,
  TResponseStyle extends ResponseStyle = "fields",
> = OmitKeys<RequestOptions<TResponse, TResponseStyle, ThrowOnError>, "body" | "path" | "query" | "url"> &
  Omit<TData, "url">

export type OptionsLegacyParser<
  TData = unknown,
  ThrowOnError extends boolean = boolean,
  TResponseStyle extends ResponseStyle = "fields",
> = TData extends { body?: any }
  ? TData extends { headers?: any }
    ? OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "body" | "headers" | "url"> & TData
    : OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "body" | "url"> &
        TData &
        Pick<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "headers">
  : TData extends { headers?: any }
    ? OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "headers" | "url"> &
        TData &
        Pick<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "body">
    : OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "url"> & TData
