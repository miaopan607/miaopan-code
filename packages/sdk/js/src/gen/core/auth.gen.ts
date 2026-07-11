// 此文件由 @hey-api/openapi-ts 自动生成

export type AuthToken = string | undefined

export interface Auth {
  /**
   * 使用请求的哪个部分发送身份验证信息？
   *
   * @default 'header'
   */
  in?: "header" | "query" | "cookie"
  /**
   * 标头或查询参数名称。
   *
   * @default 'Authorization'
   */
  name?: string
  scheme?: "basic" | "bearer"
  type: "apiKey" | "http"
}

export const getAuthToken = async (
  auth: Auth,
  callback: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken,
): Promise<string | undefined> => {
  const token = typeof callback === "function" ? await callback(auth) : callback

  if (!token) {
    return
  }

  if (auth.scheme === "bearer") {
    return `Bearer ${token}`
  }

  if (auth.scheme === "basic") {
    return `Basic ${btoa(token)}`
  }

  return token
}
