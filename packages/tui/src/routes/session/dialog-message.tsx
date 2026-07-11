import { createMemo } from "solid-js"
import { useSync } from "../../context/sync"
import { DialogSelect } from "../../ui/dialog-select"
import { useSDK } from "../../context/sdk"
import { useRoute } from "../../context/route"
import { useClipboard } from "../../context/clipboard"
import type { PromptInfo } from "../../component/prompt/history"
import { stripPromptPartIDs as strip } from "../../prompt/part"
import { useI18n } from "../../context/i18n"

export function DialogMessage(props: {
  messageID: string
  sessionID: string
  setPrompt?: (prompt: PromptInfo) => void
}) {
  const sync = useSync()
  const sdk = useSDK()
  const message = createMemo(() => sync.data.message[props.sessionID]?.find((x) => x.id === props.messageID))
  const route = useRoute()
  const clipboard = useClipboard()
  const i18n = useI18n()

  return (
    <DialogSelect
      title={i18n.t("session.message_actions")}
      options={[
        {
          title: i18n.t("session.revert"),
          value: "session.revert",
          description: i18n.t("session.revert_description"),
          onSelect: (dialog) => {
            const msg = message()
            if (!msg) return

            void sdk.client.session.revert({
              sessionID: props.sessionID,
              messageID: msg.id,
            })

            if (props.setPrompt) {
              const parts = sync.data.part[msg.id]
              const promptInfo = parts.reduce(
                (agg, part) => {
                  if (part.type === "text") {
                    if (!part.synthetic) agg.input += part.text
                  }
                  if (part.type === "file") agg.parts.push(strip(part))
                  return agg
                },
                { input: "", parts: [] as PromptInfo["parts"] },
              )
              props.setPrompt(promptInfo)
            }

            dialog.clear()
          },
        },
        {
          title: i18n.t("session.copy"),
          value: "message.copy",
          description: i18n.t("session.copy_description"),
          onSelect: async (dialog) => {
            const msg = message()
            if (!msg) return

            const parts = sync.data.part[msg.id]
            const text = parts.reduce((agg, part) => {
              if (part.type === "plan" || (part.type === "text" && !part.synthetic)) {
                agg += part.text
              }
              return agg
            }, "")

            await clipboard.write?.(text)
            dialog.clear()
          },
        },
        {
          title: i18n.t("session.fork"),
          value: "session.fork",
          description: i18n.t("session.fork_description"),
          onSelect: async (dialog) => {
            const result = await sdk.client.session.fork({
              sessionID: props.sessionID,
              messageID: props.messageID,
            })
            const msg = message()
            const prompt = msg
              ? sync.data.part[msg.id].reduce(
                  (agg, part) => {
                    if (part.type === "text") {
                      if (!part.synthetic) agg.input += part.text
                    }
                    if (part.type === "file") agg.parts.push(part)
                    return agg
                  },
                  { input: "", parts: [] as PromptInfo["parts"] },
                )
              : undefined
            route.navigate({
              sessionID: result.data!.id,
              type: "session",
              prompt,
            })
            dialog.clear()
          },
        },
      ]}
    />
  )
}
