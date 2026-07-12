import { useI18n } from "../../context/i18n"
import { useDialog } from "../../ui/dialog"
import { DialogSelect } from "../../ui/dialog-select"
import { TextAttributes } from "@opentui/core"
import { Show } from "solid-js"
import { useTheme } from "../../context/theme"

export type PlanImplementation = "current" | "fresh" | "stay"

export function planImplementationOptions(i18n: ReturnType<typeof useI18n>) {
  return [
    {
      title: i18n.t("plan.implementation_current"),
      value: "current" as const,
      description: i18n.t("plan.implementation_current_description"),
    },
    {
      title: i18n.t("plan.implementation_fresh"),
      value: "fresh" as const,
      description: i18n.t("plan.implementation_fresh_description"),
    },
    {
      title: i18n.t("plan.implementation_stay"),
      value: "stay" as const,
      description: i18n.t("plan.implementation_stay_description"),
    },
  ]
}

export function DialogPlanImplementation(props: { onSelect: (value: PlanImplementation) => void; stale?: boolean }) {
  const dialog = useDialog()
  const i18n = useI18n()
  const { theme } = useTheme()
  const title = i18n.t("plan.implementation_title")

  return (
    <DialogSelect
      title={title}
      titleView={
        <box flexDirection="column">
          <text fg={theme.text} attributes={TextAttributes.BOLD}>
            {title}
          </text>
          <Show when={props.stale}>
            <text fg={theme.error}>{i18n.t("plan.implementation_stale_warning")}</text>
          </Show>
        </box>
      }
      renderFilter={false}
      options={planImplementationOptions(i18n)}
      onSelect={(option) => {
        dialog.clear()
        props.onSelect(option.value)
      }}
    />
  )
}
