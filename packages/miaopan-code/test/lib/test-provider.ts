// Shared provider config for tests that need miaopanCode to talk to a fake LLM
// over a real HTTP endpoint. Registers a single provider `test` with the test
// models `test-model` and `test-model-2`, pointed at the URL the caller supplies
// (typically a TestLLMServer instance).
//
// Used by:
//   - test/lib/run-process.ts          (subprocess CLI tests)
//   - test/server/httpapi-sdk.test.ts  (in-process SDK tests)
export function testProviderConfig(llmUrl: string) {
  return {
    formatter: false,
    lsp: false,
    provider: {
      test: {
        name: "Test",
        id: "test",
        env: [],
        npm: "@ai-sdk/openai-compatible",
        models: {
          "test-model": {
            id: "test-model",
            name: "Test Model",
            attachment: false,
            reasoning: false,
            temperature: false,
            tool_call: true,
            release_date: "2025-01-01",
            limit: { context: 100_000, output: 10_000 },
            cost: { input: 0, output: 0 },
            options: {},
          },
          "test-model-2": {
            id: "test-model-2",
            name: "Test Model 2",
            attachment: false,
            reasoning: true,
            temperature: false,
            tool_call: true,
            release_date: "2025-01-01",
            variants: { high: { reasoningEffort: "high" } },
            limit: { context: 100_000, output: 10_000 },
            cost: { input: 0, output: 0 },
            options: {},
          },
        },
        options: { apiKey: "test-key", baseURL: llmUrl },
      },
    },
  }
}
