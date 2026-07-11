import { describe, expect, test } from "bun:test"
import { OauthCallbackPage } from "../src/oauth/page"

describe("OauthCallbackPage", () => {
  test("defaults to Chinese and supports an English page", () => {
    expect(OauthCallbackPage.success()).toContain('<html lang="zh-CN">')
    expect(OauthCallbackPage.success()).toContain("授权成功")
    expect(OauthCallbackPage.success({ language: "en" })).toContain('<html lang="en">')
    expect(OauthCallbackPage.success({ language: "en" })).toContain("Authorization successful")
  })

  test("escapes bootstrap options embedded in the inline script", () => {
    const html = OauthCallbackPage.bootstrap({
      provider: `xAI</script><script>alert("provider")</script>`,
      tokenPath: `/token</script><script>alert("path")</script>`,
    })

    expect(html.match(/<\/script>/g)).toHaveLength(1)
    expect(html).toContain(`xAI\\u003c/script>\\u003cscript>alert(\\\"provider\\\")\\u003c/script>`)
    expect(html).toContain(`/token\\u003c/script>\\u003cscript>alert(\\\"path\\\")\\u003c/script>`)
  })
})
