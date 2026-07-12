import { createSimpleContext } from "./helper"
import type { PromptRef } from "../component/prompt"
import type { PromptInfo } from "../prompt/history"
import { createStore, unwrap } from "solid-js/store"
import { useEvent } from "./event"

export type SubmittedPrompt = {
  prompt: PromptInfo
  editorParts: PromptInfo["parts"]
}

export const { use: usePromptRef, provider: PromptRefProvider } = createSimpleContext({
  name: "PromptRef",
  init: () => {
    let current: PromptRef | undefined
    const [submitted, setSubmitted] = createStore<Record<string, SubmittedPrompt | undefined>>({})

    const submittedPrompts = {
      get(sessionID: string) {
        return submitted[sessionID]
      },
      remember(sessionID: string, prompt: PromptInfo, editorParts: PromptInfo["parts"]) {
        setSubmitted(sessionID, {
          prompt: structuredClone(unwrap(prompt)),
          editorParts: structuredClone(unwrap(editorParts)),
        })
      },
      consume(sessionID: string) {
        const value = submitted[sessionID]
        if (!value) return
        const result = structuredClone(unwrap(value))
        setSubmitted(sessionID, undefined)
        return result
      },
      clear(sessionID: string) {
        setSubmitted(sessionID, undefined)
      },
    }
    const event = useEvent()
    event.on("session.status", (evt) => {
      if (evt.properties.status.type === "idle") submittedPrompts.clear(evt.properties.sessionID)
    })

    return {
      get current() {
        return current
      },
      set(ref: PromptRef | undefined) {
        current = ref
      },
      submitted: submittedPrompts,
    }
  },
})
