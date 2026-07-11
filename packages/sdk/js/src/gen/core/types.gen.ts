// 此文件由 @hey-api/openapi-ts 自动生成

import type { Language } from "../../i18n.js"

import type { Auth, AuthToken } from "./auth.gen.js"
import type { BodySerializer, QuerySerializer, QuerySerializerOptions } from "./bodySerializer.gen.js"

export interface Client<RequestFn = never, Config = unknown, MethodFn = never, BuildUrlFn = never> {
  /**
   * 返回最终请求 URL。
   */
  buildUrl: BuildUrlFn
  connect: MethodFn
  delete: MethodFn
  get: MethodFn
  getConfig: () => Config
  head: MethodFn
  options: MethodFn
  patch: MethodFn
  post: MethodFn
  put: MethodFn
  request: RequestFn
  setConfig: (config: Config) => Config
  trace: MethodFn
}

export interface Config {
  language?: Language
  /**
   * 身份验证令牌或返回身份验证令牌的函数。解析后的值会按其 `security` 数组定义添加到请求负载。
   */
  auth?: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken
  /**
   * 用于序列化请求正文参数的函数。默认使用 {@link JSON.stringify()}。
   */
  bodySerializer?: BodySerializer | null
  /**
   * 包含要预填充到 `Headers` 对象中的任意 HTTP 标头的对象。
   *
   * {@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init 查看更多}
   */
  headers?:
    | RequestInit["headers"]
    | Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined | unknown>
  /**
   * 请求方法。
   *
   * {@link https://developer.mozilla.org/docs/Web/API/fetch#method 查看更多}
   */
  method?: "CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE"
  /**
   * 用于序列化请求查询参数的函数。默认情况下，数组使用 form 样式展开，对象使用 deepObject 样式展开，并对保留字符进行百分号编码。
   *
   * 如果使用原生 `paramsSerializer()` Axios API 函数，此方法不会生效。
   *
   * {@link https://swagger.io/docs/specification/serialization/#query 查看示例}
   */
  querySerializer?: QuerySerializer | QuerySerializerOptions
  /**
   * 验证请求数据的函数。用于确保请求符合预期结构，从而可安全发送到服务器。
   */
  requestValidator?: (data: unknown) => Promise<unknown>
  /**
   * 在返回响应数据前进行转换的函数。可用于后处理数据，例如将 ISO 字符串转换为 Date 对象。
   */
  responseTransformer?: (data: unknown) => Promise<unknown>
  /**
   * 验证响应数据的函数。用于确保响应符合预期结构，从而可安全传递给转换器并返回给用户。
   */
  responseValidator?: (data: unknown) => Promise<unknown>
}

type IsExactlyNeverOrNeverUndefined<T> = [T] extends [never]
  ? true
  : [T] extends [never | undefined]
    ? [undefined] extends [T]
      ? false
      : true
    : false

export type OmitNever<T extends Record<string, unknown>> = {
  [K in keyof T as IsExactlyNeverOrNeverUndefined<T[K]> extends true ? never : K]: T[K]
}
