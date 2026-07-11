import { DialogSelect } from "../../ui/dialog-select"
import { useRoute } from "../../context/route"
import { useI18n } from "../../context/i18n"

export function DialogSubagent(props: { sessionID: string }) {
  const route = useRoute()
  const i18n = useI18n()

  return (
    <DialogSelect
      title={i18n.t("session.subagent_actions")}
      options={[
        {
          title: i18n.t("session.open"),
          value: "subagent.view",
          description: i18n.t("session.subagent_description"),
          onSelect: (dialog) => {
            route.navigate({
              type: "session",
              sessionID: props.sessionID,
            })
            dialog.clear()
          },
        },
      ]}
    />
  )
}
