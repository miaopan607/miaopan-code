import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/theme"
import { useDialog } from "./dialog"
import { useBindings, useCommandShortcut } from "../keymap"
import { t } from "@miaopan-code/core/i18n"
import { Locale } from "../util/locale"

export function DialogHelp() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const commandShortcut = useCommandShortcut("command.palette.show")
  const tr = (key: Parameters<typeof t>[1], parameters?: Parameters<typeof t>[2]) =>
    t(Locale.language(), key, parameters)

  useBindings(() => ({
    bindings: [
      { key: "return", desc: tr("help.close"), group: tr("tui.category_dialog"), cmd: () => dialog.clear() },
      { key: "escape", desc: tr("help.close"), group: tr("tui.category_dialog"), cmd: () => dialog.clear() },
    ],
  }))

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {tr("help.title")}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc/enter
        </text>
      </box>
      <box paddingBottom={1}>
        <text fg={theme.textMuted}>{tr("help.description", { shortcut: commandShortcut() })}</text>
      </box>
      <box flexDirection="row" justifyContent="flex-end" paddingBottom={1}>
        <box paddingLeft={3} paddingRight={3} backgroundColor={theme.primary} onMouseUp={() => dialog.clear()}>
          <text fg={theme.selectedListItemText}>{tr("dialog.ok")}</text>
        </box>
      </box>
    </box>
  )
}
