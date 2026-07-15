import path from "path"
import { createServer, type Server } from "node:http"
import { afterEach, expect } from "bun:test"
import { Global } from "@miaopan-code/core/global"
import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { CrossSpawnSpawner } from "@miaopan-code/core/cross-spawn-spawner"
import { Effect } from "effect"
import { streamText } from "ai"
import { ProviderV2 } from "@miaopan-code/core/provider"
import { ModelV2 } from "@miaopan-code/core/model"
import { disposeAllInstances, provideTmpdirInstance } from "../fixture/fixture"
import { testEffect } from "../lib/effect"
import { testProviderConfig } from "../lib/test-provider"
import { Env } from "@/env"
import { Plugin } from "@/plugin"
import { Provider } from "@/provider/provider"

afterEach(async () => {
  await disposeAllInstances()
})

const it = testEffect(
  LayerNode.compile(LayerNode.group([Provider.node, Env.node, Plugin.node, CrossSpawnSpawner.node])),
)

it.live("records the final AI SDK provider request", () =>
  Effect.gen(function* () {
    const server = yield* Effect.acquireRelease(
      Effect.promise(() => responseServer()),
      (server) => Effect.sync(() => server.server.close()),
    )
    const marker = `raw-request-${crypto.randomUUID()}`

    yield* send({ url: server.url, marker, record: true })

    const entries = yield* Effect.promise(readEntries)
    const entry = entries.find((item) => requestContains(item, marker))
    expect(entry).toMatchObject({
      runtime: "ai-sdk",
      providerID: "test",
      modelID: "test-model",
      method: "POST",
      headers: { authorization: "<redacted>", "content-type": "application/json" },
    })
    expect(entry?.url).toContain("/chat/completions")
    expect(entry?.body).toMatchObject({ model: "test-model" })
  }),
)

it.live("records every outbound retry attempt", () =>
  Effect.gen(function* () {
    const server = yield* Effect.acquireRelease(
      Effect.promise(() => responseServer(1)),
      (server) => Effect.sync(() => server.server.close()),
    )
    const marker = `raw-request-retry-${crypto.randomUUID()}`

    yield* send({ url: server.url, marker, record: true, maxRetries: 1 })

    const entries = (yield* Effect.promise(readEntries)).filter((item) => requestContains(item, marker))
    expect(entries).toHaveLength(2)
    const sequences = entries.map((item) => item.sequence).filter((value): value is number => typeof value === "number")
    expect(sequences).toHaveLength(2)
    expect(sequences[1]).toBeGreaterThan(sequences[0])
  }),
)

it.live("does not record provider requests while disabled", () =>
  Effect.gen(function* () {
    const server = yield* Effect.acquireRelease(
      Effect.promise(() => responseServer()),
      (server) => Effect.sync(() => server.server.close()),
    )
    const marker = `raw-request-disabled-${crypto.randomUUID()}`

    yield* send({ url: server.url, marker, record: false })

    const entries = yield* Effect.promise(readEntries)
    expect(entries.some((item) => requestContains(item, marker))).toBe(false)
  }),
)

async function readEntries() {
  const contents = await Bun.file(path.join(Global.Path.log, "llm-requests.jsonl"))
    .text()
    .catch((error) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return ""
      throw error
    })
  return contents
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
}

function requestContains(entry: Record<string, unknown>, marker: string) {
  return JSON.stringify(entry.body).includes(marker)
}

function send(input: { url: string; marker: string; record: boolean; maxRetries?: number }) {
  return provideTmpdirInstance(
    () =>
      Effect.gen(function* () {
        const provider = yield* Provider.Service
        const model = yield* provider.getModel(ProviderV2.ID.make("test"), ModelV2.ID.make("test-model"))
        const result = streamText({
          model: yield* provider.getLanguage(model),
          maxRetries: input.maxRetries,
          messages: [{ role: "user", content: input.marker }],
        })

        expect(yield* Effect.promise(() => result.text)).toBe("ok")
      }),
    {
      config: {
        ...testProviderConfig(input.url),
        experimental: input.record ? { record_raw_requests: true } : undefined,
      },
    },
  )
}

async function responseServer(failures = 0): Promise<{ server: Server; url: string }> {
  let calls = 0
  const server = createServer((_, res) => {
    calls++
    if (calls <= failures) {
      res.writeHead(500, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: { message: "retry" } }))
      return
    }
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.end('data: {"choices":[{"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n')
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("server did not bind to a TCP port")
  return { server, url: `http://127.0.0.1:${address.port}` }
}
