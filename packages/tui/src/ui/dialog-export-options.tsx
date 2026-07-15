import { TextareaRenderable, TextAttributes } from "@opentui/core"
import { useTheme } from "../context/theme"
import { useDialog, type DialogContext } from "./dialog"
import { createStore } from "solid-js/store"
import { onMount, Show } from "solid-js"
import { useBindings } from "../keymap"
import { useI18n } from "../context/i18n"

type DialogExportOptionsValue = {
  filename: string
  thinking: boolean
  toolDetails: boolean
  assistantMetadata: boolean
  continuationRecords: boolean
  openWithoutSaving: boolean
}

type DialogExportOptionsDefaults = {
  defaultFilename: string
  defaultThinking: boolean
  defaultToolDetails: boolean
  defaultAssistantMetadata: boolean
  defaultContinuationRecords: boolean
  defaultOpenWithoutSaving: boolean
}

export type DialogExportOptionsProps = DialogExportOptionsDefaults & {
  onConfirm?: (options: DialogExportOptionsValue) => void
  onCancel?: () => void
}

const optionOrder = [
  "filename",
  "thinking",
  "toolDetails",
  "assistantMetadata",
  "continuationRecords",
  "openWithoutSaving",
] as const
type Option = (typeof optionOrder)[number]

export function DialogExportOptions(props: DialogExportOptionsProps) {
  const dialog = useDialog()
  const { theme } = useTheme()
  const i18n = useI18n()
  let textarea: TextareaRenderable
  const [store, setStore] = createStore({
    thinking: props.defaultThinking,
    toolDetails: props.defaultToolDetails,
    assistantMetadata: props.defaultAssistantMetadata,
    continuationRecords: props.defaultContinuationRecords,
    openWithoutSaving: props.defaultOpenWithoutSaving,
    active: "filename" as Option,
  })

  useBindings(() => ({
    bindings: [
      {
        key: "tab",
        desc: i18n.t("select.next_item"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => {
          const currentIndex = optionOrder.indexOf(store.active)
          setStore("active", optionOrder[(currentIndex + 1) % optionOrder.length])
        },
      },
    ],
  }))

  useBindings(() => ({
    enabled: store.active !== "filename",
    bindings: [
      {
        key: "space",
        desc: i18n.t("dialog.toggle"),
        group: i18n.t("tui.category_dialog"),
        cmd: () => {
          if (store.active === "thinking") setStore("thinking", !store.thinking)
          if (store.active === "toolDetails") setStore("toolDetails", !store.toolDetails)
          if (store.active === "assistantMetadata") setStore("assistantMetadata", !store.assistantMetadata)
          if (store.active === "continuationRecords") setStore("continuationRecords", !store.continuationRecords)
          if (store.active === "openWithoutSaving") setStore("openWithoutSaving", !store.openWithoutSaving)
        },
      },
    ],
  }))

  onMount(() => {
    dialog.setSize("medium")
    setTimeout(() => {
      if (!textarea || textarea.isDestroyed) return
      textarea.focus()
    }, 1)
    textarea.gotoLineEnd()
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {i18n.t("dialog.export_options")}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      <box gap={1}>
        <box>
          <text fg={theme.text}>{i18n.t("dialog.filename")}</text>
        </box>
        <textarea
          onSubmit={() => {
            props.onConfirm?.({
              filename: textarea.plainText,
              thinking: store.thinking,
              toolDetails: store.toolDetails,
              assistantMetadata: store.assistantMetadata,
              continuationRecords: store.continuationRecords,
              openWithoutSaving: store.openWithoutSaving,
            })
          }}
          height={3}
          ref={(val: TextareaRenderable) => {
            textarea = val
            val.traits = { status: "FILENAME" }
          }}
          initialValue={props.defaultFilename}
          placeholder={i18n.t("dialog.enter_filename")}
          placeholderColor={theme.textMuted}
          textColor={theme.text}
          focusedTextColor={theme.text}
          cursorColor={theme.text}
        />
      </box>
      <box flexDirection="column">
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={store.active === "thinking" ? theme.backgroundElement : undefined}
          onMouseUp={() => setStore("active", "thinking")}
        >
          <text fg={store.active === "thinking" ? theme.primary : theme.textMuted}>
            {store.thinking ? "[x]" : "[ ]"}
          </text>
          <text fg={store.active === "thinking" ? theme.primary : theme.text}>{i18n.t("dialog.include_thinking")}</text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={store.active === "toolDetails" ? theme.backgroundElement : undefined}
          onMouseUp={() => setStore("active", "toolDetails")}
        >
          <text fg={store.active === "toolDetails" ? theme.primary : theme.textMuted}>
            {store.toolDetails ? "[x]" : "[ ]"}
          </text>
          <text fg={store.active === "toolDetails" ? theme.primary : theme.text}>
            {i18n.t("dialog.include_tool_details")}
          </text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={store.active === "assistantMetadata" ? theme.backgroundElement : undefined}
          onMouseUp={() => setStore("active", "assistantMetadata")}
        >
          <text fg={store.active === "assistantMetadata" ? theme.primary : theme.textMuted}>
            {store.assistantMetadata ? "[x]" : "[ ]"}
          </text>
          <text fg={store.active === "assistantMetadata" ? theme.primary : theme.text}>
            {i18n.t("dialog.include_assistant_metadata")}
          </text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={store.active === "continuationRecords" ? theme.backgroundElement : undefined}
          onMouseUp={() => setStore("active", "continuationRecords")}
        >
          <text fg={store.active === "continuationRecords" ? theme.primary : theme.textMuted}>
            {store.continuationRecords ? "[x]" : "[ ]"}
          </text>
          <text fg={store.active === "continuationRecords" ? theme.primary : theme.text}>
            {i18n.t("dialog.include_continuation_records")}
          </text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={store.active === "openWithoutSaving" ? theme.backgroundElement : undefined}
          onMouseUp={() => setStore("active", "openWithoutSaving")}
        >
          <text fg={store.active === "openWithoutSaving" ? theme.primary : theme.textMuted}>
            {store.openWithoutSaving ? "[x]" : "[ ]"}
          </text>
          <text fg={store.active === "openWithoutSaving" ? theme.primary : theme.text}>
            {i18n.t("dialog.open_without_saving")}
          </text>
        </box>
      </box>
      <Show when={store.active !== "filename"}>
        <text fg={theme.textMuted} paddingBottom={1}>
          {i18n.t("dialog.press_space_toggle_return_confirm")}
        </text>
      </Show>
      <Show when={store.active === "filename"}>
        <text fg={theme.textMuted} paddingBottom={1}>
          {i18n.t("dialog.press_return_confirm_tab_options")}
        </text>
      </Show>
    </box>
  )
}

DialogExportOptions.show = (dialog: DialogContext, defaults: DialogExportOptionsDefaults) => {
  return new Promise<DialogExportOptionsValue | null>((resolve) => {
    dialog.replace(
      () => (
        <DialogExportOptions {...defaults} onConfirm={(options) => resolve(options)} onCancel={() => resolve(null)} />
      ),
      () => resolve(null),
    )
  })
}
