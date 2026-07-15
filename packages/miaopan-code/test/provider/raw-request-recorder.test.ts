import path from "path"
import { describe, expect, test } from "bun:test"
import { RawRequestRecorder } from "@/provider/raw-request-recorder"
import { tmpdir } from "../fixture/fixture"

describe("RawRequestRecorder", () => {
  test("records final request data and redacts obvious secrets", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "requests.jsonl")
    const recorder = RawRequestRecorder.make({ file })

    await recorder.record({
      providerID: "test",
      modelID: "test-model",
      input: new URL("https://example.com/v1/chat/completions?key=url-secret&safe=1"),
      init: {
        method: "POST",
        headers: {
          authorization: "Bearer header-secret",
          "content-type": "application/json",
          "session-id": "session-1",
          "x-api-key": "header-api-key",
        },
        body: JSON.stringify({
          model: "test-model",
          apiKey: "body-api-key",
          nested: { access_token: "body-token" },
          messages: [{ role: "user", content: "keep this prompt unchanged" }],
          tools: [{ inputSchema: { properties: { apiKey: { type: "string" } } } }],
        }),
      },
    })

    const entry = JSON.parse(await Bun.file(file).text())
    expect(entry).toMatchObject({
      runtime: "ai-sdk",
      providerID: "test",
      modelID: "test-model",
      sequence: 1,
      method: "POST",
      headers: {
        authorization: "<redacted>",
        "content-type": "application/json",
        "session-id": "session-1",
        "x-api-key": "<redacted>",
      },
      body: {
        model: "test-model",
        apiKey: "<redacted>",
        nested: { access_token: "<redacted>" },
        messages: [{ role: "user", content: "keep this prompt unchanged" }],
        tools: [{ inputSchema: { properties: { apiKey: { type: "string" } } } }],
      },
    })
    expect(entry.url).toBe("https://example.com/v1/chat/completions?key=%3Credacted%3E&safe=1")
  })

  test("does not reject the provider request when recording fails", async () => {
    await using tmp = await tmpdir()
    const errors: unknown[] = []
    const recorder = RawRequestRecorder.make({
      file: tmp.path,
      onError: (error) => errors.push(error),
    })

    await expect(
      recorder.record({
        providerID: "test",
        modelID: "test-model",
        input: "https://example.com/v1/chat/completions",
        init: { method: "POST", body: "{}" },
      }),
    ).resolves.toBeUndefined()
    expect(errors).toHaveLength(1)
  })
})
