import { describe, expect, test } from "bun:test"
import { t } from "@miaopan-code/core/i18n"
import { ModelV2 } from "@miaopan-code/core/model"
import { ProviderV2 } from "@miaopan-code/core/provider"
import { Identifier } from "../../src/id/id"
import { Image } from "../../src/image/image"
import { Provider } from "../../src/provider/provider"
import { ProviderError } from "../../src/provider/error"
import { Question } from "../../src/question"
import { LocalContext } from "../../src/util/local-context"
import { parseRemoteRepositoryReference, validateRepositoryBranch } from "../../src/util/repository"
import { resolveTheme } from "../../src/cli/cmd/run/theme"

describe("runtime edge i18n", () => {
  test("low-level helpers default to Chinese and accept English", () => {
    expect(() => Identifier.ascending("session", "bad")).toThrow(
      t("zh-CN", "error.id_prefix", { given: "bad", prefix: "ses" }),
    )
    expect(() => Identifier.ascending("session", "bad", "en")).toThrow(
      t("en", "error.id_prefix", { given: "bad", prefix: "ses" }),
    )

    expect(() => LocalContext.create("demo").use()).toThrow(
      t("zh-CN", "error.local_context_not_found", { name: "demo" }),
    )
    expect(() => LocalContext.create("demo", "en").use()).toThrow(
      t("en", "error.local_context_not_found", { name: "demo" }),
    )
  })

  test("repository and theme validation use the requested language", () => {
    expect(() => parseRemoteRepositoryReference("file:///tmp/demo")).toThrow(t("zh-CN", "error.repository_local"))
    expect(() => parseRemoteRepositoryReference("file:///tmp/demo", "en")).toThrow(t("en", "error.repository_local"))
    expect(() => validateRepositoryBranch("-bad", "en")).toThrow(t("en", "error.repository_branch_invalid"))

    const theme = { defs: { loop: "loop" }, theme: { background: "loop" } } as never
    expect(() => resolveTheme(theme, "dark")).toThrow(t("zh-CN", "error.theme_circular", { chain: "loop -> loop" }))
    expect(() => resolveTheme(theme, "dark", "en")).toThrow(t("en", "error.theme_circular", { chain: "loop -> loop" }))
  })

  test("error objects retain their construction language", () => {
    expect(new Image.DecodeError({}).message).toBe(t("zh-CN", "error.image_decode"))
    expect(new Image.DecodeError({ language: "en" }).message).toBe(t("en", "error.image_decode"))
    expect(new Question.RejectedError({ language: "en" }).message).toBe(t("en", "question.user_dismissed"))
    expect(new ProviderError.HeaderTimeoutError(10, "en").message).toBe(
      t("en", "error.provider_headers_timeout", { ms: 10 }),
    )
    expect(
      new Provider.ModelNotFoundError({
        providerID: ProviderV2.ID.make("demo"),
        modelID: ModelV2.ID.make("missing"),
        language: "en",
      }).message,
    ).toBe(t("en", "error.model_not_found", { model: "demo/missing" }))
  })
})
