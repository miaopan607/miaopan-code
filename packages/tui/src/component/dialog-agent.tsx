import { createMemo } from "solid-js"
import { useLocal } from "../context/local"
import { DialogSelect } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"
import { useI18n } from "../context/i18n"

export function DialogAgent() {
  const local = useLocal()
  const dialog = useDialog()
  const i18n = useI18n()

  const options = createMemo(() =>
    local.agent.list().map((item) => {
      return {
        value: item.name,
        title: item.name,
        description: item.native ? i18n.t("tui.native") : item.description,
      }
    }),
  )

  return (
    <DialogSelect
      title={i18n.t("tui.select_agent")}
      current={local.agent.current()?.name}
      options={options()}
      onSelect={(option) => {
        local.agent.set(option.value)
        dialog.clear()
      }}
    />
  )
}
