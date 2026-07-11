import type { TuiPluginApi } from "@miaopan-code/plugin/tui"
import { createMemo, For, type Accessor } from "solid-js"
import { DEFAULT_THEMES, useTheme } from "../../context/theme"
import { useCommandShortcut } from "../../keymap"
import type { Language, MessageKey } from "@miaopan-code/core/i18n"
import { t } from "@miaopan-code/core/i18n"
import { useI18n } from "../../context/i18n"

const themeCount = Object.keys(DEFAULT_THEMES).length

type TipPart = { text: string; highlight: boolean }
type TipShortcut = Accessor<string>
type Shortcuts = {
  agentCycle: TipShortcut
  childFirst: TipShortcut
  childNext: TipShortcut
  childPrevious: TipShortcut
  commandList: TipShortcut
  editorOpen: TipShortcut
  helpShow: TipShortcut
  inputClear: TipShortcut
  inputNewline: TipShortcut
  inputPaste: TipShortcut
  inputUndo: TipShortcut
  leader: TipShortcut
  messagesCopy: TipShortcut
  messagesFirst: TipShortcut
  messagesLast: TipShortcut
  messagesPageDown: TipShortcut
  messagesPageUp: TipShortcut
  messagesToggleConceal: TipShortcut
  modelCycleRecent: TipShortcut
  modelList: TipShortcut
  sessionExport: TipShortcut
  sessionInterrupt: TipShortcut
  sessionList: TipShortcut
  sessionNew: TipShortcut
  sessionParent: TipShortcut
  sessionPinToggle: TipShortcut
  sessionQuickSwitch1: TipShortcut
  sessionQuickSwitch9: TipShortcut
  sessionSidebarToggle: TipShortcut
  sessionTimeline: TipShortcut
  statusView: TipShortcut
  terminalSuspend: TipShortcut
  themeList: TipShortcut
}
type Tip = string | ((shortcuts: Shortcuts, language: Language) => string | undefined)
type TipKey = MessageKey

function parse(tip: string): TipPart[] {
  const parts: TipPart[] = []
  const regex = /\{highlight\}(.*?)\{\/highlight\}/g
  const found = Array.from(tip.matchAll(regex))
  const state = found.reduce(
    (acc, match) => {
      const start = match.index ?? 0
      if (start > acc.index) {
        acc.parts.push({ text: tip.slice(acc.index, start), highlight: false })
      }
      acc.parts.push({ text: match[1], highlight: true })
      acc.index = start + match[0].length
      return acc
    },
    { parts, index: 0 },
  )

  if (state.index < tip.length) {
    parts.push({ text: tip.slice(state.index), highlight: false })
  }

  return parts
}

const translate = (language: Language, key: TipKey, parameters?: Record<string, string | number | undefined>) =>
  t(language, key, parameters)

function shortcutText(value: string) {
  return `{highlight}${value}{/highlight}`
}

function commandText(command: string, shortcut: string, language: Language) {
  if (!shortcut) return shortcutText(command)
  return translate(language, "tips.command_or", { command: shortcutText(command), shortcut: shortcutText(shortcut) })
}

function press(shortcut: string, text: string, language: Language) {
  if (!shortcut) return undefined
  return translate(language, "tips.press", { shortcut: shortcutText(shortcut), text })
}

function configShortcut(api: TuiPluginApi, command: string): TipShortcut {
  return () =>
    api.tuiConfig.keybinds
      .get(command)
      .map((binding) => api.keys.formatSequence(Array.from(api.keymap.parseKeySequence(binding.key))))
      .filter(Boolean)
      .join(", ")
}

export function Tips(props: { api: TuiPluginApi; connected?: boolean }) {
  const i18n = useI18n()
  const theme = useTheme().theme
  const tipOffset = Math.random()
  const shortcuts: Shortcuts = {
    agentCycle: useCommandShortcut("agent.cycle"),
    childFirst: configShortcut(props.api, "session.child.first"),
    childNext: configShortcut(props.api, "session.child.next"),
    childPrevious: configShortcut(props.api, "session.child.previous"),
    commandList: useCommandShortcut("command.palette.show"),
    editorOpen: useCommandShortcut("prompt.editor"),
    helpShow: useCommandShortcut("help.show"),
    inputClear: useCommandShortcut("prompt.clear"),
    inputNewline: useCommandShortcut("input.newline"),
    inputPaste: useCommandShortcut("prompt.paste"),
    inputUndo: useCommandShortcut("input.undo"),
    leader: configShortcut(props.api, "leader"),
    messagesCopy: configShortcut(props.api, "messages.copy"),
    messagesFirst: configShortcut(props.api, "session.first"),
    messagesLast: configShortcut(props.api, "session.last"),
    messagesPageDown: configShortcut(props.api, "session.page.down"),
    messagesPageUp: configShortcut(props.api, "session.page.up"),
    messagesToggleConceal: configShortcut(props.api, "session.toggle.conceal"),
    modelCycleRecent: useCommandShortcut("model.cycle_recent"),
    modelList: useCommandShortcut("model.list"),
    sessionExport: configShortcut(props.api, "session.export"),
    sessionInterrupt: configShortcut(props.api, "session.interrupt"),
    sessionList: useCommandShortcut("session.list"),
    sessionNew: useCommandShortcut("session.new"),
    sessionParent: configShortcut(props.api, "session.parent"),
    sessionPinToggle: configShortcut(props.api, "session.pin.toggle"),
    sessionQuickSwitch1: useCommandShortcut("session.quick_switch.1"),
    sessionQuickSwitch9: useCommandShortcut("session.quick_switch.9"),
    sessionSidebarToggle: configShortcut(props.api, "session.sidebar.toggle"),
    sessionTimeline: configShortcut(props.api, "session.timeline"),
    statusView: useCommandShortcut("miaopanCode.status"),
    terminalSuspend: useCommandShortcut("terminal.suspend"),
    themeList: useCommandShortcut("theme.switch"),
  }
  const tip = createMemo(() => {
    if (props.connected === false) return translate(i18n.language(), "tips.no_models")
    const tips = [...TIPS, process.platform !== "win32" ? TERMINAL_SUSPEND_TIP : INPUT_UNDO_TIP].flatMap((item) => {
      const value = typeof item === "string" ? item : item(shortcuts, i18n.language())
      return value ? [value] : []
    })
    return tips[Math.floor(tipOffset * tips.length)] ?? translate(i18n.language(), "tips.no_models")
  })
  // Solid can expose a memo's initial value while a pure computation is pending.
  const parts = createMemo(() => {
    const value = tip()
    if (typeof value === "string") return parse(value)
    return parse(translate(i18n.language(), "tips.no_models"))
  })

  return (
    <box flexDirection="row" maxWidth="100%">
      <text flexShrink={0} style={{ fg: theme.warning }}>
        ● {translate(i18n.language(), "tips.label")}{" "}
      </text>
      <text flexShrink={1} wrapMode="word">
        <For each={parts()}>
          {(part) => <span style={{ fg: part.highlight ? theme.text : theme.textMuted }}>{part.text}</span>}
        </For>
      </text>
    </box>
  )
}

const TIPS: Tip[] = [
  (_shortcuts, language) => translate(language, "tips.attach_files"),
  (_shortcuts, language) => translate(language, "tips.shell_commands"),
  (shortcuts, language) => press(shortcuts.agentCycle(), translate(language, "tips.cycle_agents"), language),
  (_shortcuts, language) => translate(language, "tips.undo"),
  (_shortcuts, language) => translate(language, "tips.redo"),
  (_shortcuts, language) => translate(language, "tips.share"),
  (_shortcuts, language) => translate(language, "tips.media"),
  (shortcuts, language) => press(shortcuts.inputPaste(), translate(language, "tips.paste_prompt"), language),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/editor", shortcuts.editorOpen(), language),
      text: translate(language, "tips.editor"),
    }),
  (_shortcuts, language) => translate(language, "tips.init"),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/models", shortcuts.modelList(), language),
      text: translate(language, "tips.switch_models"),
    }),
  (shortcuts, language) =>
    translate(language, "tips.use_count", {
      command: commandText("/themes", shortcuts.themeList(), language),
      text: translate(language, "tips.switch_themes"),
      count: themeCount,
    }),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/new", shortcuts.sessionNew(), language),
      text: translate(language, "tips.new_session"),
    }),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/sessions", shortcuts.sessionList(), language),
      text: translate(language, "tips.sessions"),
    }),
  (shortcuts, language) => press(shortcuts.sessionPinToggle(), translate(language, "tips.pin_session"), language),
  (shortcuts, language) =>
    shortcuts.sessionQuickSwitch1() && shortcuts.sessionQuickSwitch9()
      ? translate(language, "tips.through", {
          first: shortcutText(shortcuts.sessionQuickSwitch1()),
          last: shortcutText(shortcuts.sessionQuickSwitch9()),
          text: translate(language, "tips.quick_sessions"),
        })
      : undefined,
  (_shortcuts, language) => translate(language, "tips.compact"),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/export", shortcuts.sessionExport(), language),
      text: translate(language, "tips.export"),
    }),
  (shortcuts, language) => press(shortcuts.messagesCopy(), translate(language, "tips.copy_last"), language),
  (shortcuts, language) => press(shortcuts.commandList(), translate(language, "tips.commands_list"), language),
  (_shortcuts, language) => translate(language, "tips.connect"),
  (shortcuts, language) => translate(language, "tips.leader", { key: shortcutText(shortcuts.leader()) }),
  (shortcuts, language) => press(shortcuts.modelCycleRecent(), translate(language, "tips.recent_models"), language),
  (shortcuts, language) => press(shortcuts.sessionSidebarToggle(), translate(language, "tips.sidebar"), language),
  (shortcuts, language) =>
    shortcuts.messagesPageUp() && shortcuts.messagesPageDown()
      ? translate(language, "tips.use", {
          command: `${shortcutText(shortcuts.messagesPageUp())}/${shortcutText(shortcuts.messagesPageDown())}`,
          text: translate(language, "tips.history"),
        })
      : undefined,
  (shortcuts, language) => press(shortcuts.messagesFirst(), translate(language, "tips.first_message"), language),
  (shortcuts, language) => press(shortcuts.messagesLast(), translate(language, "tips.last_message"), language),
  (shortcuts, language) => press(shortcuts.inputNewline(), translate(language, "tips.newline"), language),
  (shortcuts, language) => press(shortcuts.inputClear(), translate(language, "tips.clear_input"), language),
  (shortcuts, language) => press(shortcuts.sessionInterrupt(), translate(language, "tips.interrupt"), language),
  (_shortcuts, language) => translate(language, "tips.plan"),
  (_shortcuts, language) => translate(language, "tips.subagent"),
  (shortcuts, language) => {
    const items = [
      shortcuts.sessionParent(),
      shortcuts.childFirst(),
      shortcuts.childPrevious(),
      shortcuts.childNext(),
    ].filter(Boolean)
    if (!items.length) return undefined
    return translate(language, "tips.use", {
      command: items.map(shortcutText).join(" / "),
      text: translate(language, "tips.parent_child"),
    })
  },
  (_shortcuts, language) => translate(language, "tips.config_files"),
  (_shortcuts, language) => translate(language, "tips.global_tui"),
  (_shortcuts, language) => translate(language, "tips.schema"),
  (_shortcuts, language) => translate(language, "tips.model"),
  (_shortcuts, language) => translate(language, "tips.keybinds"),
  (_shortcuts, language) => translate(language, "tips.disable_keybind"),
  (_shortcuts, language) => translate(language, "tips.mcp"),
  (_shortcuts, language) => translate(language, "tips.commands"),
  (_shortcuts, language) => translate(language, "tips.arguments"),
  (_shortcuts, language) => translate(language, "tips.backticks"),
  (_shortcuts, language) => translate(language, "tips.agent_files"),
  (_shortcuts, language) => translate(language, "tips.agent_permissions"),
  (_shortcuts, language) => translate(language, "tips.allow_pattern"),
  (_shortcuts, language) => translate(language, "tips.deny_pattern"),
  (_shortcuts, language) => translate(language, "tips.ask_pattern"),
  (_shortcuts, language) => translate(language, "tips.formatter_on"),
  (_shortcuts, language) => translate(language, "tips.formatter_off"),
  (_shortcuts, language) => translate(language, "tips.formatter_custom"),
  (_shortcuts, language) => translate(language, "tips.lsp"),
  (_shortcuts, language) => translate(language, "tips.tool_files"),
  (_shortcuts, language) => translate(language, "tips.tool_scripts"),
  (_shortcuts, language) => translate(language, "tips.plugin_files"),
  (_shortcuts, language) => translate(language, "tips.plugin_notifications"),
  (_shortcuts, language) => translate(language, "tips.plugin_sensitive"),
  (_shortcuts, language) => translate(language, "tips.cli_run"),
  (_shortcuts, language) => translate(language, "tips.cli_continue"),
  (_shortcuts, language) => translate(language, "tips.cli_attach"),
  (_shortcuts, language) => translate(language, "tips.cli_json"),
  (_shortcuts, language) => translate(language, "tips.cli_serve"),
  (_shortcuts, language) => translate(language, "tips.cli_attach_server"),
  (_shortcuts, language) => translate(language, "tips.cli_upgrade"),
  (_shortcuts, language) => translate(language, "tips.cli_auth"),
  (_shortcuts, language) => translate(language, "tips.cli_agent"),
  (_shortcuts, language) => translate(language, "tips.github_trigger"),
  (_shortcuts, language) => translate(language, "tips.github_install"),
  (_shortcuts, language) => translate(language, "tips.github_fix"),
  (_shortcuts, language) => translate(language, "tips.github_review"),
  (_shortcuts, language) => translate(language, "tips.theme_system"),
  (_shortcuts, language) => translate(language, "tips.theme_files"),
  (_shortcuts, language) => translate(language, "tips.theme_modes"),
  (_shortcuts, language) => translate(language, "tips.theme_colors"),
  (_shortcuts, language) => translate(language, "tips.env"),
  (_shortcuts, language) => translate(language, "tips.file"),
  (_shortcuts, language) => translate(language, "tips.instructions"),
  (_shortcuts, language) => translate(language, "tips.temperature"),
  (_shortcuts, language) => translate(language, "tips.steps"),
  (_shortcuts, language) => translate(language, "tips.disable_tool"),
  (_shortcuts, language) => translate(language, "tips.disable_mcp"),
  (_shortcuts, language) => translate(language, "tips.agent_tools"),
  (_shortcuts, language) => translate(language, "tips.share_auto"),
  (_shortcuts, language) => translate(language, "tips.share_disabled"),
  (_shortcuts, language) => translate(language, "tips.unshare"),
  (_shortcuts, language) => translate(language, "tips.doom_loop"),
  (_shortcuts, language) => translate(language, "tips.external_directory"),
  (_shortcuts, language) => translate(language, "tips.debug_config"),
  (_shortcuts, language) => translate(language, "tips.print_logs"),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/timeline", shortcuts.sessionTimeline(), language),
      text: translate(language, "tips.timeline"),
    }),
  (shortcuts, language) => press(shortcuts.messagesToggleConceal(), translate(language, "tips.conceal"), language),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/status", shortcuts.statusView(), language),
      text: translate(language, "tips.status"),
    }),
  (_shortcuts, language) => translate(language, "tips.scroll"),
  (shortcuts, language) =>
    shortcuts.commandList()
      ? `${translate(language, "tips.username")} (${shortcutText(shortcuts.commandList())})`
      : translate(language, "tips.username"),
  (_shortcuts, language) => translate(language, "tips.docker"),
  (_shortcuts, language) => translate(language, "tips.zen"),
  (_shortcuts, language) => translate(language, "tips.agents_commit"),
  (_shortcuts, language) => translate(language, "tips.review"),
  (shortcuts, language) =>
    translate(language, "tips.use", {
      command: commandText("/help", shortcuts.helpShow(), language),
      text: translate(language, "tips.help"),
    }),
  (_shortcuts, language) => translate(language, "tips.rename"),
]

const INPUT_UNDO_TIP: Tip = (shortcuts, language) =>
  press(shortcuts.inputUndo(), translate(language, "tips.undo_input"), language)
const TERMINAL_SUSPEND_TIP: Tip = (shortcuts, language) =>
  press(shortcuts.terminalSuspend(), translate(language, "tips.suspend"), language)
