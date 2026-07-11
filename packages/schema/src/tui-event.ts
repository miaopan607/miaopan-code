export * as TuiEvent from "./tui-event"

import { Effect, Schema } from "effect"
import { optional } from "./schema"
import { Event } from "./event"
import { PositiveInt } from "./schema"
import { SessionID } from "./session-id"
import { t, type Language } from "./i18n"

const DEFAULT_TOAST_DURATION = 5000

export function make(language?: Language) {
  const PromptAppend = Event.define({ type: "tui.prompt.append", schema: { text: Schema.String } })
  const CommandExecute = Event.define({
    type: "tui.command.execute",
    schema: {
      command: Schema.Union([
        Schema.Literals([
          "session.list",
          "session.new",
          "session.share",
          "session.interrupt",
          "session.compact",
          "session.page.up",
          "session.page.down",
          "session.line.up",
          "session.line.down",
          "session.half.page.up",
          "session.half.page.down",
          "session.first",
          "session.last",
          "prompt.clear",
          "prompt.submit",
          "agent.cycle",
        ]),
        Schema.String,
      ]),
    },
  })
  const ToastShow = Event.define({
    type: "tui.toast.show",
    schema: {
      title: optional(Schema.String),
      message: Schema.String,
      variant: Schema.Literals(["info", "success", "warning", "error"]),
      duration: PositiveInt.pipe(Schema.withDecodingDefault(Effect.succeed(DEFAULT_TOAST_DURATION))).annotate({
        description: t(language, "tui_duration"),
      }),
    },
  })
  const SessionSelect = Event.define({
    type: "tui.session.select",
    schema: {
      sessionID: SessionID.annotate({ description: t(language, "tui_session_id") }),
    },
  })
  const Definitions = Event.inventory(PromptAppend, CommandExecute, ToastShow, SessionSelect)
  return { PromptAppend, CommandExecute, ToastShow, SessionSelect, Definitions }
}

const events = make()
export const PromptAppend = events.PromptAppend
export const CommandExecute = events.CommandExecute
export const ToastShow = events.ToastShow
export const SessionSelect = events.SessionSelect
export const Definitions = events.Definitions
