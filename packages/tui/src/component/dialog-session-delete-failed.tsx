import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { createStore } from "solid-js/store"
import { For } from "solid-js"
import { useBindings } from "../keymap"
import { useI18n } from "../context/i18n"

export function DialogSessionDeleteFailed(props: {
  session: string
  workspace: string
  onDelete?: () => boolean | void | Promise<boolean | void>
  onRestore?: () => boolean | void | Promise<boolean | void>
  onDone?: () => void
}) {
  const dialog = useDialog()
  const { theme } = useTheme()
  const i18n = useI18n()
  const [store, setStore] = createStore({
    active: "delete" as "delete" | "restore",
  })

  const options = [
    {
      id: "delete" as const,
      title: i18n.t("session.delete_workspace"),
      description: i18n.t("session.delete_workspace_description"),
      run: props.onDelete,
    },
    {
      id: "restore" as const,
      title: i18n.t("session.restore_workspace"),
      description: i18n.t("session.restore_workspace_description"),
      run: props.onRestore,
    },
  ]

  async function confirm() {
    const result = await options.find((item) => item.id === store.active)?.run?.()
    if (result === false) return
    props.onDone?.()
    if (!props.onDone) dialog.clear()
  }

  useBindings(() => ({
    bindings: [
      {
        key: "return",
        desc: i18n.t("session.confirm_recovery"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => void confirm(),
      },
      {
        key: "left",
        desc: i18n.t("session.delete_workspace"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => setStore("active", "delete"),
      },
      {
        key: "up",
        desc: i18n.t("session.delete_workspace"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => setStore("active", "delete"),
      },
      {
        key: "right",
        desc: i18n.t("session.restore_workspace"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => setStore("active", "restore"),
      },
      {
        key: "down",
        desc: i18n.t("session.restore_workspace"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => setStore("active", "restore"),
      },
    ],
  }))

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {i18n.t("session.delete_failed_title")}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      <text fg={theme.textMuted} wrapMode="word">
        {i18n.t("session.delete_failed_message", { session: props.session, workspace: props.workspace })}
      </text>
      <text fg={theme.textMuted} wrapMode="word">
        {i18n.t("session.delete_failed_recover")}
      </text>
      <box flexDirection="column" paddingBottom={1} gap={1}>
        <For each={options}>
          {(item) => (
            <box
              flexDirection="column"
              paddingLeft={1}
              paddingRight={1}
              paddingTop={1}
              paddingBottom={1}
              backgroundColor={item.id === store.active ? theme.primary : undefined}
              onMouseUp={() => {
                setStore("active", item.id)
                void confirm()
              }}
            >
              <text
                attributes={TextAttributes.BOLD}
                fg={item.id === store.active ? theme.selectedListItemText : theme.text}
              >
                {item.title}
              </text>
              <text fg={item.id === store.active ? theme.selectedListItemText : theme.textMuted} wrapMode="word">
                {item.description}
              </text>
            </box>
          )}
        </For>
      </box>
    </box>
  )
}
