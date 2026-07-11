import { describe, expect, test } from "bun:test"
import { t } from "../src/i18n"
import { HttpApi, OpenApi } from "effect/unstable/httpapi"
import { makeHealthGroup } from "../src/groups/health"
import { makeMessageGroup } from "../src/groups/message"
import { makeSessionsCursor } from "../src/groups/session"
import { Effect } from "effect"

describe("Protocol i18n", () => {
  test("defaults to Simplified Chinese and supports English", () => {
    expect(t(undefined, "health_summary")).toBe("检查服务器健康状态")
    expect(t("en", "health_summary")).toBe("Check server health")
  })

  test("language reaches actual OpenAPI annotations", () => {
    const chinese = OpenApi.fromApi(HttpApi.make("test").add(makeHealthGroup()))
    const english = OpenApi.fromApi(HttpApi.make("test").add(makeHealthGroup("en")))
    expect(chinese.paths["/api/health"]?.get?.summary).toBe("检查服务器健康状态")
    expect(english.paths["/api/health"]?.get?.summary).toBe("Check server health")
    const messages = OpenApi.fromApi(HttpApi.make("test").add(makeMessageGroup("en")))
    expect(messages.paths["/api/session/{sessionID}/message"]?.get?.description).toContain("projected messages")
  })

  test("cursor errors default to Chinese and support English", () => {
    expect(Effect.runSync(Effect.flip(makeSessionsCursor().parse("invalid")))).toBe("游标无效")
    expect(Effect.runSync(Effect.flip(makeSessionsCursor("en").parse("invalid")))).toBe("Invalid cursor")
  })
})
