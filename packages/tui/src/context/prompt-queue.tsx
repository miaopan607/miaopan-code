import { createStore, produce, unwrap } from "solid-js/store"
import type { PromptInfo } from "../prompt/history"
import { createSimpleContext } from "./helper"

export type QueuedPrompt = {
  id: string
  prompt: PromptInfo
  editorParts: PromptInfo["parts"]
}

export function createPromptQueue() {
  const [store, setStore] = createStore<Record<string, QueuedPrompt[]>>({})
  const [paused, setPaused] = createStore<Record<string, boolean>>({})

  return {
    items(sessionID: string) {
      return store[sessionID] ?? []
    },
    enqueue(sessionID: string, prompt: PromptInfo, editorParts: PromptInfo["parts"] = []) {
      const item = {
        id: crypto.randomUUID(),
        prompt: structuredClone(unwrap(prompt)),
        editorParts: structuredClone(unwrap(editorParts)),
      }
      setStore(
        produce((draft) => {
          draft[sessionID] = [...(draft[sessionID] ?? []), item]
        }),
      )
      return item
    },
    remove(sessionID: string, id: string) {
      setStore(sessionID, (items = []) => items.filter((item) => item.id !== id))
    },
    pop(sessionID: string) {
      const item = store[sessionID]?.at(-1)
      if (!item) return
      setStore(sessionID, (items = []) => items.slice(0, -1))
      return structuredClone(unwrap(item))
    },
    clear(sessionID: string) {
      setStore(sessionID, [])
    },
    isPaused(sessionID: string) {
      return paused[sessionID] === true
    },
    pause(sessionID: string) {
      setPaused(sessionID, true)
    },
    resume(sessionID: string) {
      setPaused(sessionID, false)
    },
  }
}

export const { use: usePromptQueue, provider: PromptQueueProvider } = createSimpleContext({
  name: "PromptQueue",
  init: createPromptQueue,
})
