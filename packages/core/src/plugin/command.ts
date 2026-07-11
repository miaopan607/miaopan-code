export * as CommandPlugin from "./command"

import { define } from "./internal"
import { Effect } from "effect"
import { Config } from "../config"
import { Location } from "../location"
import { t } from "../i18n"
import { CommandPrompt } from "./command/prompt"

export const Plugin = define({
  id: "command",
  effect: Effect.fn(function* (ctx) {
    const config = yield* Config.Service
    const location = yield* Location.Service
    const language = Config.latest(yield* config.entries(), "language")
    const initialize = CommandPrompt.text(language, "initialize")
    const review = CommandPrompt.text(language, "review")
    yield* ctx.command.transform((draft) => {
      draft.update("init", (command) => {
        command.template = initialize.replace("${path}", location.project.directory)
        command.description = t(language, "command.init_description")
      })
      draft.update("review", (command) => {
        command.template = review.replace("${path}", location.project.directory)
        command.description = t(language, "command.review_description")
        command.subtask = true
      })
    })
  }),
})
