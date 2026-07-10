export * from "./client.js"
export * from "./server.js"

import { createMiaopanCodeClient } from "./client.js"
import { createMiaopanCodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createMiaopanCode(options?: ServerOptions) {
  const server = await createMiaopanCodeServer({
    ...options,
  })

  const client = createMiaopanCodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
