// 此文件由 @hey-api/openapi-ts 自动生成

import type { ClientOptions } from "./types.gen.js"
import { type Config, type ClientOptions as DefaultClientOptions, createClient, createConfig } from "./client/index.js"

/**
 * `createClientConfig()` 函数会在客户端初始化时调用，返回的对象将成为客户端的初始配置。
 *
 * 你可能希望通过这种方式初始化客户端，而不是调用 `setConfig()`。例如在使用 Next.js 时，这有助于确保客户端始终具有正确的值。
 */
export type CreateClientConfig<T extends DefaultClientOptions = ClientOptions> = (
  override?: Config<DefaultClientOptions & T>,
) => Config<Required<DefaultClientOptions> & T>

export const client = createClient(
  createConfig<ClientOptions>({
    baseUrl: "http://localhost:4096",
  }),
)
