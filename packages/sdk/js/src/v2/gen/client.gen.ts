// 此文件由 @hey-api/openapi-ts 自动生成

import { type ClientOptions, type Config, createClient, createConfig } from "./client/index.js"
import type { ClientOptions as ClientOptions2 } from "./types.gen.js"

/**
 * `createClientConfig()` 函数会在客户端初始化时调用，返回的对象将成为客户端的初始配置。
 *
 * 你可能希望通过这种方式初始化客户端，而不是调用 `setConfig()`。例如在使用 Next.js 时，这有助于确保客户端始终具有正确的值。
 */
export type CreateClientConfig<T extends ClientOptions = ClientOptions2> = (
  override?: Config<ClientOptions & T>,
) => Config<Required<ClientOptions> & T>

export const client = createClient(createConfig<ClientOptions2>({ baseUrl: "http://localhost:4096" }))
