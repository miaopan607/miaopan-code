export * as TuiKeybind from "./keybind"

import type { KeyEvent, Renderable } from "@opentui/core"
import type { Binding } from "@opentui/keymap"
import type { BindingCommandMap, BindingConfig, BindingDefaults } from "@opentui/keymap/extras"
import { Schema } from "effect"
import { t } from "@miaopan-code/core/i18n"
import { Locale } from "../util/locale"

const KeyStroke = Schema.Struct({
  name: Schema.String,
  ctrl: Schema.optional(Schema.Boolean),
  shift: Schema.optional(Schema.Boolean),
  meta: Schema.optional(Schema.Boolean),
  super: Schema.optional(Schema.Boolean),
  hyper: Schema.optional(Schema.Boolean),
})

const BindingObject = Schema.StructWithRest(
  Schema.Struct({
    key: Schema.Union([Schema.String, KeyStroke]),
    event: Schema.optional(Schema.Literals(["press", "release"])),
    preventDefault: Schema.optional(Schema.Boolean),
    fallthrough: Schema.optional(Schema.Boolean),
  }),
  [Schema.Record(Schema.String, Schema.Unknown)],
)

const BindingItem = Schema.Union([Schema.String, KeyStroke, BindingObject])
export const BindingValueSchema = Schema.Union([
  Schema.Literal(false),
  Schema.Literal("none"),
  BindingItem,
  Schema.Array(BindingItem),
])
export type BindingValueSchema = Schema.Schema.Type<typeof BindingValueSchema>

type Definition = {
  default: BindingValueSchema
  description: string
  descriptionKey?: Parameters<typeof t>[1]
}

export const LeaderDefault = "ctrl+x"

const keybind = (value: Definition["default"], description: string): Definition => {
  if (!description.startsWith("i18n:")) return { default: value, description }
  const key = description.slice(5) as Parameters<typeof t>[1]
  return { default: value, description: t(Locale.language(), key), descriptionKey: key }
}

export const Definitions = {
  leader: keybind(LeaderDefault, "i18n:keybind.leader"),

  app_exit: keybind("ctrl+c,ctrl+d,<leader>q", "i18n:tui.exit"),
  app_debug: keybind("none", "i18n:tui.toggle_debug_panel"),
  app_console: keybind("none", "i18n:tui.toggle_console"),
  app_heap_snapshot: keybind("none", "i18n:tui.write_heap_snapshot"),
  app_toggle_animations: keybind("none", "i18n:keybind.app_toggle_animations"),
  app_toggle_file_context: keybind("none", "i18n:keybind.app_toggle_file_context"),
  app_toggle_diffwrap: keybind("none", "i18n:keybind.app_toggle_diffwrap"),
  app_toggle_paste_summary: keybind("none", "i18n:keybind.app_toggle_paste_summary"),
  app_toggle_session_directory_filter: keybind("none", "i18n:keybind.app_toggle_session_directory_filter"),
  command_list: keybind("ctrl+p", "i18n:keybind.command_list"),
  help_show: keybind("none", "i18n:keybind.help_show"),
  docs_open: keybind("none", "i18n:tui.open_docs"),
  diff_open: keybind("none", "i18n:diff.open"),
  diff_close: keybind("escape,q", "i18n:diff.close"),
  diff_toggle: keybind("enter,space", "i18n:diff.toggle_item"),
  diff_expand: keybind("right", "i18n:diff.expand_item"),
  diff_expand_all: keybind("E", "i18n:diff.expand_all"),
  diff_collapse: keybind("left", "i18n:diff.collapse_item"),
  diff_switch_focus: keybind("tab", "i18n:diff.switch_focus"),
  diff_next_hunk: keybind("]", "i18n:diff.next_hunk"),
  diff_previous_hunk: keybind("[", "i18n:diff.previous_hunk"),
  diff_next_file: keybind("n", "i18n:diff.next_file"),
  diff_previous_file: keybind("p", "i18n:diff.previous_file"),
  diff_toggle_file_tree: keybind("b", "i18n:diff.toggle_file_tree"),
  diff_single_patch: keybind("s", "i18n:diff.single_patch"),
  diff_switch_source: keybind("d", "i18n:diff.switch_source"),
  diff_toggle_view: keybind("v", "i18n:diff.toggle_view"),
  diff_help: keybind("?", "i18n:diff.help"),

  editor_open: keybind("<leader>e", "i18n:keybind.editor_open"),
  theme_list: keybind("<leader>t", "i18n:keybind.theme_list"),
  theme_switch_mode: keybind("none", "i18n:keybind.theme_switch_mode"),
  theme_mode_lock: keybind("none", "i18n:keybind.theme_mode_lock"),
  sidebar_toggle: keybind("<leader>b", "i18n:keybind.sidebar_toggle"),
  scrollbar_toggle: keybind("none", "i18n:session.toggle_scrollbar"),
  status_view: keybind("<leader>s", "i18n:tui.view_status"),
  debug_view: keybind("none", "i18n:tui.view_debug_info"),

  session_export: keybind("<leader>x", "i18n:keybind.session_export"),
  session_copy: keybind("none", "i18n:session.copy_transcript"),
  session_move: keybind("none", "i18n:prompt.move"),
  session_new: keybind("<leader>n", "i18n:tui.new_session"),
  session_list: keybind("<leader>l", "i18n:session.list"),
  session_timeline: keybind("<leader>g", "i18n:keybind.session_timeline"),
  session_fork: keybind("none", "i18n:keybind.session_fork"),
  session_rename: keybind("ctrl+r", "i18n:session.rename"),
  session_delete: keybind("ctrl+d", "i18n:keybind.session_delete"),
  session_share: keybind("none", "i18n:keybind.session_share"),
  session_unshare: keybind("none", "i18n:keybind.session_unshare"),
  session_interrupt: keybind("escape", "i18n:keybind.session_interrupt"),
  session_background: keybind("ctrl+b", "i18n:keybind.session_background"),
  session_compact: keybind("<leader>c", "i18n:keybind.session_compact"),
  session_toggle_timestamps: keybind("none", "i18n:keybind.session_toggle_timestamps"),
  session_toggle_generic_tool_output: keybind("none", "i18n:keybind.session_toggle_generic_tool_output"),
  session_queued_prompts: keybind("<leader>q", "i18n:cli.run.queued_prompts"),
  session_child_first: keybind("<leader>down", "i18n:keybind.session_child_first"),
  session_child_cycle: keybind("right", "i18n:keybind.session_child_cycle"),
  session_child_cycle_reverse: keybind("left", "i18n:keybind.session_child_cycle_reverse"),
  session_parent: keybind("up", "i18n:session.go_parent"),
  session_pin_toggle: keybind("ctrl+f", "i18n:keybind.session_pin_toggle"),
  session_quick_switch_1: keybind("<leader>1", "i18n:keybind.session_quick_switch_1"),
  session_quick_switch_2: keybind("<leader>2", "i18n:keybind.session_quick_switch_2"),
  session_quick_switch_3: keybind("<leader>3", "i18n:keybind.session_quick_switch_3"),
  session_quick_switch_4: keybind("<leader>4", "i18n:keybind.session_quick_switch_4"),
  session_quick_switch_5: keybind("<leader>5", "i18n:keybind.session_quick_switch_5"),
  session_quick_switch_6: keybind("<leader>6", "i18n:keybind.session_quick_switch_6"),
  session_quick_switch_7: keybind("<leader>7", "i18n:keybind.session_quick_switch_7"),
  session_quick_switch_8: keybind("<leader>8", "i18n:keybind.session_quick_switch_8"),
  session_quick_switch_9: keybind("<leader>9", "i18n:keybind.session_quick_switch_9"),

  stash_delete: keybind("ctrl+d", "i18n:keybind.stash_delete"),
  model_provider_list: keybind("ctrl+a", "i18n:keybind.model_provider_list"),
  model_favorite_toggle: keybind("ctrl+f", "i18n:keybind.model_favorite_toggle"),
  model_list: keybind("<leader>m", "i18n:tui.switch_model"),
  model_cycle_recent: keybind("f2", "i18n:tui.model_cycle"),
  model_cycle_recent_reverse: keybind("shift+f2", "i18n:tui.model_cycle_reverse"),
  model_cycle_favorite: keybind("none", "i18n:tui.favorite_cycle"),
  model_cycle_favorite_reverse: keybind("none", "i18n:tui.favorite_cycle_reverse"),
  mcp_list: keybind("none", "i18n:tui.toggle_mcps"),
  provider_connect: keybind("none", "i18n:tui.connect_provider"),
  console_org_switch: keybind("none", "i18n:keybind.console_org_switch"),
  agent_list: keybind("<leader>a", "i18n:keybind.agent_list"),
  agent_cycle: keybind("tab", "i18n:tui.agent_cycle"),
  agent_cycle_reverse: keybind("shift+tab", "i18n:tui.agent_cycle_reverse"),
  variant_cycle: keybind("ctrl+t", "i18n:tui.variant_cycle"),
  variant_list: keybind("none", "i18n:tui.switch_model_variant"),

  messages_page_up: keybind("pageup,ctrl+alt+b", "i18n:keybind.messages_page_up"),
  messages_page_down: keybind("pagedown,ctrl+alt+f", "i18n:keybind.messages_page_down"),
  messages_line_up: keybind("ctrl+alt+y", "i18n:keybind.messages_line_up"),
  messages_line_down: keybind("ctrl+alt+e", "i18n:keybind.messages_line_down"),
  messages_half_page_up: keybind("ctrl+alt+u", "i18n:keybind.messages_half_page_up"),
  messages_half_page_down: keybind("ctrl+alt+d", "i18n:keybind.messages_half_page_down"),
  messages_first: keybind("ctrl+g,home", "i18n:keybind.messages_first"),
  messages_last: keybind("ctrl+alt+g,end", "i18n:keybind.messages_last"),
  messages_next: keybind("none", "i18n:keybind.messages_next"),
  messages_previous: keybind("none", "i18n:keybind.messages_previous"),
  messages_last_user: keybind("none", "i18n:keybind.messages_last_user"),
  messages_copy: keybind("<leader>y", "i18n:keybind.messages_copy"),
  messages_undo: keybind("<leader>u", "i18n:keybind.messages_undo"),
  messages_redo: keybind("<leader>r", "i18n:keybind.messages_redo"),
  messages_toggle_conceal: keybind("<leader>h", "i18n:keybind.messages_toggle_conceal"),
  tool_details: keybind("none", "i18n:keybind.tool_details"),
  display_thinking: keybind("none", "i18n:keybind.display_thinking"),

  prompt_submit: keybind("none", "i18n:prompt.submit"),
  prompt_editor_context_clear: keybind("none", "i18n:keybind.prompt_editor_context_clear"),
  prompt_skills: keybind("none", "i18n:keybind.prompt_skills"),
  prompt_stash: keybind("none", "i18n:prompt.stash"),
  prompt_stash_pop: keybind("none", "i18n:keybind.prompt_stash_pop"),
  prompt_stash_list: keybind("none", "i18n:keybind.prompt_stash_list"),
  workspace_set: keybind("none", "i18n:keybind.workspace_set"),

  input_clear: keybind("ctrl+c", "i18n:keybind.input_clear"),
  input_paste: keybind({ key: "ctrl+v", preventDefault: false }, "i18n:keybind.input_paste"),
  input_submit: keybind("return", "i18n:keybind.input_submit"),
  input_newline: keybind("shift+return,ctrl+return,alt+return,ctrl+j", "i18n:keybind.input_newline"),
  input_move_left: keybind("left,ctrl+b", "i18n:keybind.input_move_left"),
  input_move_right: keybind("right,ctrl+f", "i18n:keybind.input_move_right"),
  input_move_up: keybind("up", "i18n:keybind.input_move_up"),
  input_move_down: keybind("down", "i18n:keybind.input_move_down"),
  input_select_left: keybind("shift+left", "i18n:keybind.input_select_left"),
  input_select_right: keybind("shift+right", "i18n:keybind.input_select_right"),
  input_select_up: keybind("shift+up", "i18n:keybind.input_select_up"),
  input_select_down: keybind("shift+down", "i18n:keybind.input_select_down"),
  input_line_home: keybind("ctrl+a", "i18n:keybind.input_line_home"),
  input_line_end: keybind("ctrl+e", "i18n:keybind.input_line_end"),
  input_select_line_home: keybind("ctrl+shift+a", "i18n:keybind.input_select_line_home"),
  input_select_line_end: keybind("ctrl+shift+e", "i18n:keybind.input_select_line_end"),
  input_visual_line_home: keybind("alt+a", "i18n:keybind.input_visual_line_home"),
  input_visual_line_end: keybind("alt+e", "i18n:keybind.input_visual_line_end"),
  input_select_visual_line_home: keybind("alt+shift+a", "i18n:keybind.input_select_visual_line_home"),
  input_select_visual_line_end: keybind("alt+shift+e", "i18n:keybind.input_select_visual_line_end"),
  input_buffer_home: keybind("home", "i18n:keybind.input_buffer_home"),
  input_buffer_end: keybind("end", "i18n:keybind.input_buffer_end"),
  input_select_buffer_home: keybind("shift+home", "i18n:keybind.input_select_buffer_home"),
  input_select_buffer_end: keybind("shift+end", "i18n:keybind.input_select_buffer_end"),
  input_delete_line: keybind("ctrl+shift+d", "i18n:keybind.input_delete_line"),
  input_delete_to_line_end: keybind("ctrl+k", "i18n:keybind.input_delete_to_line_end"),
  input_delete_to_line_start: keybind("ctrl+u", "i18n:keybind.input_delete_to_line_start"),
  input_backspace: keybind("backspace,shift+backspace", "i18n:keybind.input_backspace"),
  input_delete: keybind("ctrl+d,delete,shift+delete", "i18n:keybind.input_delete"),
  input_undo: keybind("ctrl+-,super+z", "i18n:keybind.input_undo"),
  input_redo: keybind("ctrl+.,super+shift+z", "i18n:keybind.input_redo"),
  input_word_forward: keybind("alt+f,alt+right,ctrl+right", "i18n:keybind.input_word_forward"),
  input_word_backward: keybind("alt+b,alt+left,ctrl+left", "i18n:keybind.input_word_backward"),
  input_select_word_forward: keybind("alt+shift+f,alt+shift+right", "i18n:keybind.input_select_word_forward"),
  input_select_word_backward: keybind("alt+shift+b,alt+shift+left", "i18n:keybind.input_select_word_backward"),
  input_delete_word_forward: keybind("alt+d,alt+delete,ctrl+delete", "i18n:keybind.input_delete_word_forward"),
  input_delete_word_backward: keybind("ctrl+w,ctrl+backspace,alt+backspace", "i18n:keybind.input_delete_word_backward"),
  input_select_all: keybind("super+a", "i18n:keybind.input_select_all"),
  history_previous: keybind("up", "i18n:keybind.history_previous"),
  history_next: keybind("down", "i18n:keybind.history_next"),

  "dialog.select.prev": keybind("up,ctrl+p", "i18n:keybind.dialog_select_prev"),
  "dialog.select.next": keybind("down,ctrl+n", "i18n:keybind.dialog_select_next"),
  "dialog.select.page_up": keybind("pageup", "i18n:keybind.dialog_select_page_up"),
  "dialog.select.page_down": keybind("pagedown", "i18n:keybind.dialog_select_page_down"),
  "dialog.select.home": keybind("home", "i18n:keybind.dialog_select_home"),
  "dialog.select.end": keybind("end", "i18n:keybind.dialog_select_end"),
  "dialog.select.submit": keybind("return", "i18n:keybind.dialog_select_submit"),
  "dialog.prompt.submit": keybind("return", "i18n:dialog.submit_prompt"),
  "dialog.mcp.toggle": keybind("space", "i18n:keybind.dialog_mcp_toggle"),
  "dialog.move_session.new": keybind("ctrl+m", "i18n:keybind.dialog_move_session_new"),
  "dialog.move_session.delete": keybind("ctrl+d", "i18n:keybind.dialog_move_session_delete"),
  "dialog.move_session.refresh": keybind("ctrl+r", "i18n:keybind.dialog_move_session_refresh"),
  "prompt.autocomplete.prev": keybind("up,ctrl+p", "i18n:keybind.prompt_autocomplete_prev"),
  "prompt.autocomplete.next": keybind("down,ctrl+n", "i18n:keybind.prompt_autocomplete_next"),
  "prompt.autocomplete.hide": keybind("escape", "i18n:autocomplete.hide"),
  "prompt.autocomplete.select": keybind("return", "i18n:autocomplete.select"),
  "prompt.autocomplete.complete": keybind("tab", "i18n:autocomplete.complete"),
  "permission.prompt.fullscreen": keybind("ctrl+f", "i18n:keybind.permission_prompt_fullscreen"),
  "plugins.toggle": keybind("space", "i18n:keybind.plugins_toggle"),
  "dialog.plugins.install": keybind("shift+i", "i18n:keybind.dialog_plugins_install"),

  terminal_suspend: keybind("ctrl+z", "i18n:tui.suspend_terminal"),
  terminal_title_toggle: keybind("none", "i18n:keybind.terminal_title_toggle"),
  tips_toggle: keybind("<leader>h", "i18n:keybind.tips_toggle"),
  plugin_manager: keybind("none", "i18n:keybind.plugin_manager"),
  plugin_install: keybind("none", "i18n:plugin.install"),

  which_key_toggle: keybind("ctrl+alt+k", "i18n:keybind.which_key_toggle"),
  which_key_layout_toggle: keybind("ctrl+alt+shift+k", "i18n:keybind.which_key_layout_toggle"),
  which_key_pending_toggle: keybind("ctrl+alt+shift+p", "i18n:keybind.which_key_pending_toggle"),
  which_key_group_previous: keybind("ctrl+alt+left,ctrl+alt+[", "i18n:keybind.which_key_group_previous"),
  which_key_group_next: keybind("ctrl+alt+right,ctrl+alt+]", "i18n:keybind.which_key_group_next"),
  which_key_scroll_up: keybind("ctrl+alt+up,ctrl+alt+p", "i18n:keybind.which_key_scroll_up"),
  which_key_scroll_down: keybind("ctrl+alt+down,ctrl+alt+n", "i18n:keybind.which_key_scroll_down"),
  which_key_page_up: keybind("ctrl+alt+pageup", "i18n:keybind.which_key_page_up"),
  which_key_page_down: keybind("ctrl+alt+pagedown", "i18n:keybind.which_key_page_down"),
  which_key_home: keybind("ctrl+alt+home", "i18n:keybind.which_key_home"),
  which_key_end: keybind("ctrl+alt+end", "i18n:keybind.which_key_end"),
} satisfies Record<string, Definition>

type KeybindName = keyof typeof Definitions
const KeybindNames = new Set<string>(Object.keys(Definitions))

export const KeybindOverrides = Schema.Struct(
  Object.fromEntries(
    Object.entries(Definitions).map(([name, item]) => [
      name,
      Schema.optional(BindingValueSchema).annotate({ description: item.description }),
    ]),
  ),
).annotate({ description: t(Locale.language(), "tui.config.keybind_overrides") })
export const Descriptions = Object.fromEntries(
  Object.entries(Definitions).map(([name, item]) => [
    name,
    item.descriptionKey ? t(Locale.language(), item.descriptionKey) : item.description,
  ]),
) as Record<KeybindName, string>
export const CommandMap = {
  app_exit: "app.exit",
  app_debug: "app.debug",
  app_console: "app.console",
  app_heap_snapshot: "app.heap_snapshot",
  app_toggle_animations: "app.toggle.animations",
  app_toggle_file_context: "app.toggle.file_context",
  app_toggle_diffwrap: "app.toggle.diffwrap",
  app_toggle_paste_summary: "app.toggle.paste_summary",
  app_toggle_session_directory_filter: "app.toggle.session_directory_filter",
  command_list: "command.palette.show",
  help_show: "help.show",
  docs_open: "docs.open",
  diff_open: "diff.open",
  diff_close: "diff.close",
  diff_toggle: "diff.toggle",
  diff_expand: "diff.expand",
  diff_expand_all: "diff.expand_all",
  diff_collapse: "diff.collapse",
  diff_switch_focus: "diff.switch_focus",
  diff_next_hunk: "diff.next_hunk",
  diff_previous_hunk: "diff.previous_hunk",
  diff_next_file: "diff.next_file",
  diff_previous_file: "diff.previous_file",
  diff_toggle_file_tree: "diff.toggle_file_tree",
  diff_single_patch: "diff.single_patch",
  diff_switch_source: "diff.switch_source",
  diff_toggle_view: "diff.toggle_view",
  diff_help: "diff.help",
  editor_open: "prompt.editor",
  theme_list: "theme.switch",
  theme_switch_mode: "theme.switch_mode",
  theme_mode_lock: "theme.mode.lock",
  sidebar_toggle: "session.sidebar.toggle",
  scrollbar_toggle: "session.toggle.scrollbar",
  status_view: "miaopanCode.status",
  debug_view: "miaopanCode.debug",
  session_export: "session.export",
  session_copy: "session.copy",
  session_move: "session.move",
  session_new: "session.new",
  session_list: "session.list",
  session_timeline: "session.timeline",
  session_fork: "session.fork",
  session_rename: "session.rename",
  session_delete: "session.delete",
  session_share: "session.share",
  session_unshare: "session.unshare",
  session_interrupt: "session.interrupt",
  session_background: "session.background",
  session_compact: "session.compact",
  session_toggle_timestamps: "session.toggle.timestamps",
  session_toggle_generic_tool_output: "session.toggle.generic_tool_output",
  session_queued_prompts: "session.queued_prompts",
  session_child_first: "session.child.first",
  session_child_cycle: "session.child.next",
  session_child_cycle_reverse: "session.child.previous",
  session_parent: "session.parent",
  session_pin_toggle: "session.pin.toggle",
  session_quick_switch_1: "session.quick_switch.1",
  session_quick_switch_2: "session.quick_switch.2",
  session_quick_switch_3: "session.quick_switch.3",
  session_quick_switch_4: "session.quick_switch.4",
  session_quick_switch_5: "session.quick_switch.5",
  session_quick_switch_6: "session.quick_switch.6",
  session_quick_switch_7: "session.quick_switch.7",
  session_quick_switch_8: "session.quick_switch.8",
  session_quick_switch_9: "session.quick_switch.9",
  stash_delete: "stash.delete",
  model_provider_list: "model.dialog.provider",
  model_favorite_toggle: "model.dialog.favorite",
  model_list: "model.list",
  model_cycle_recent: "model.cycle_recent",
  model_cycle_recent_reverse: "model.cycle_recent_reverse",
  model_cycle_favorite: "model.cycle_favorite",
  model_cycle_favorite_reverse: "model.cycle_favorite_reverse",
  mcp_list: "mcp.list",
  provider_connect: "provider.connect",
  console_org_switch: "console.org.switch",
  agent_list: "agent.list",
  agent_cycle: "agent.cycle",
  agent_cycle_reverse: "agent.cycle.reverse",
  variant_cycle: "variant.cycle",
  variant_list: "variant.list",
  messages_page_up: "session.page.up",
  messages_page_down: "session.page.down",
  messages_line_up: "session.line.up",
  messages_line_down: "session.line.down",
  messages_half_page_up: "session.half.page.up",
  messages_half_page_down: "session.half.page.down",
  messages_first: "session.first",
  messages_last: "session.last",
  messages_next: "session.message.next",
  messages_previous: "session.message.previous",
  messages_last_user: "session.messages_last_user",
  messages_copy: "messages.copy",
  messages_undo: "session.undo",
  messages_redo: "session.redo",
  messages_toggle_conceal: "session.toggle.conceal",
  tool_details: "session.toggle.actions",
  display_thinking: "session.toggle.thinking",
  prompt_submit: "prompt.submit",
  prompt_editor_context_clear: "prompt.editor_context.clear",
  prompt_skills: "prompt.skills",
  prompt_stash: "prompt.stash",
  prompt_stash_pop: "prompt.stash.pop",
  prompt_stash_list: "prompt.stash.list",
  workspace_set: "workspace.set",
  input_clear: "prompt.clear",
  input_paste: "prompt.paste",
  input_submit: "input.submit",
  input_newline: "input.newline",
  input_move_left: "input.move.left",
  input_move_right: "input.move.right",
  input_move_up: "input.move.up",
  input_move_down: "input.move.down",
  input_select_left: "input.select.left",
  input_select_right: "input.select.right",
  input_select_up: "input.select.up",
  input_select_down: "input.select.down",
  input_line_home: "input.line.home",
  input_line_end: "input.line.end",
  input_select_line_home: "input.select.line.home",
  input_select_line_end: "input.select.line.end",
  input_visual_line_home: "input.visual.line.home",
  input_visual_line_end: "input.visual.line.end",
  input_select_visual_line_home: "input.select.visual.line.home",
  input_select_visual_line_end: "input.select.visual.line.end",
  input_buffer_home: "input.buffer.home",
  input_buffer_end: "input.buffer.end",
  input_select_buffer_home: "input.select.buffer.home",
  input_select_buffer_end: "input.select.buffer.end",
  input_delete_line: "input.delete.line",
  input_delete_to_line_end: "input.delete.to.line.end",
  input_delete_to_line_start: "input.delete.to.line.start",
  input_backspace: "input.backspace",
  input_delete: "input.delete",
  input_undo: "input.undo",
  input_redo: "input.redo",
  input_word_forward: "input.word.forward",
  input_word_backward: "input.word.backward",
  input_select_word_forward: "input.select.word.forward",
  input_select_word_backward: "input.select.word.backward",
  input_delete_word_forward: "input.delete.word.forward",
  input_delete_word_backward: "input.delete.word.backward",
  input_select_all: "input.select.all",
  history_previous: "prompt.history.previous",
  history_next: "prompt.history.next",
  terminal_suspend: "terminal.suspend",
  terminal_title_toggle: "terminal.title.toggle",
  tips_toggle: "tips.toggle",
  plugin_manager: "plugins.list",
  plugin_install: "plugins.install",
  which_key_toggle: "which-key.toggle",
  which_key_layout_toggle: "which-key.layout.toggle",
  which_key_pending_toggle: "which-key.pending.toggle",
  which_key_group_previous: "which-key.group.previous",
  which_key_group_next: "which-key.group.next",
  which_key_scroll_up: "which-key.scroll.up",
  which_key_scroll_down: "which-key.scroll.down",
  which_key_page_up: "which-key.page.up",
  which_key_page_down: "which-key.page.down",
  which_key_home: "which-key.home",
  which_key_end: "which-key.end",
} satisfies BindingCommandMap
const CommandDescriptions = Object.fromEntries(
  Object.entries(Definitions).map(([name, item]) => [
    CommandMap[name as keyof typeof CommandMap] ?? name,
    item.descriptionKey ? t(Locale.language(), item.descriptionKey) : item.description,
  ]),
) as Record<string, string>

export type Keybinds = { [K in KeybindName]: BindingValueSchema }
export type KeybindOverrides = Partial<Keybinds>
export type BindingLookupView = {
  readonly bindings: readonly Binding<Renderable, KeyEvent>[]
  get(command: string): readonly Binding<Renderable, KeyEvent>[]
  has(command: string): boolean
  gather(name: string, commands: readonly string[]): readonly Binding<Renderable, KeyEvent>[]
  pick(name: string, commands: readonly string[]): Binding<Renderable, KeyEvent>[]
  omit(name: string, commands: readonly string[]): Binding<Renderable, KeyEvent>[]
}

export function toBindingConfig(keybinds: Keybinds): BindingConfig<Renderable, KeyEvent> {
  return Object.fromEntries(Object.entries(keybinds)) as BindingConfig<Renderable, KeyEvent>
}

const decodeBindingValue = Schema.decodeUnknownSync(BindingValueSchema)

export function defaultValue(name: KeybindName) {
  return Definitions[name].default
}

export function parse(keybinds: KeybindOverrides): Keybinds {
  const invalid = unknownKeys(keybinds)
  if (invalid.length)
    throw new Error(
      t(Locale.language(), "tui.error.keybind_invalid", {
        suffix: invalid.length === 1 ? "" : "s",
        keys: invalid.join(", "),
      }),
    )
  return Object.fromEntries(
    Object.entries(Definitions).map(([name, item]) => [
      name,
      decodeBindingValue(keybinds[name as KeybindName] ?? item.default),
    ]),
  ) as Keybinds
}

export const Keybinds = { parse }

export function unknownKeys(input: object) {
  return Object.keys(input).filter((key) => !KeybindNames.has(key))
}

export function bindingDefaults(): BindingDefaults<Renderable, KeyEvent> {
  return ({ command, binding }) => {
    if (binding.desc !== undefined) return
    return { desc: CommandDescriptions[command] }
  }
}
