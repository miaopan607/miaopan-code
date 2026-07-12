import { createMemo } from "solid-js"
import { DialogSelect, type DialogSelectRef } from "../ui/dialog-select"
import { type DialogContext } from "../ui/dialog"
import {
  COMMAND_PALETTE_COMMAND,
  formatKeyBindings,
  type OpenTuiKeymap,
  useKeymapSelector,
  useMiaopanCodeKeymap,
} from "../keymap"
import { useTuiConfig } from "../config"
import { useI18n } from "../context/i18n"
import { localizeKnownText } from "@miaopan-code/core/i18n"
import { useKV } from "../context/kv"
import { canReorderFavorite, reorderFavorite } from "../util/favorite"

type PaletteCommandEntry = ReturnType<OpenTuiKeymap["getCommandEntries"]>[number]
type PaletteValue = {
  command: string
  section: "favorite" | "suggested" | "all"
}
type PaletteOption<T> = Omit<T, "value"> & { category?: string; value: PaletteValue }

export function commandPaletteOptions<T extends { suggested: boolean; value: PaletteValue }>(
  options: T[],
  favorites: string[],
  filtered: boolean,
  categories: { favorites: string; suggested: string },
): PaletteOption<T>[] {
  if (filtered) return options
  const commands = new Map(options.map((option) => [option.value.command, option]))
  return [
    ...favorites.flatMap((command) => {
      const option = commands.get(command)
      return option
        ? [{ ...option, value: { command, section: "favorite" as const }, category: categories.favorites }]
        : []
    }),
    ...options
      .filter((option) => option.suggested)
      .map((option) => ({
        ...option,
        value: { command: option.value.command, section: "suggested" as const },
        category: categories.suggested,
      })),
    ...options,
  ]
}

function isVisiblePaletteCommand(command: PaletteCommandEntry["command"]) {
  return command.hidden !== true && command.name !== COMMAND_PALETTE_COMMAND
}

function isSuggestedPaletteCommand(entry: PaletteCommandEntry) {
  const suggested = entry.command.suggested
  if (typeof suggested === "boolean") return suggested
  if (typeof suggested === "function") return suggested() === true
  return false
}

export function CommandPaletteDialog() {
  const config = useTuiConfig()
  const i18n = useI18n()
  const keymap = useMiaopanCodeKeymap()
  const kv = useKV()
  const [storedFavorites, setStoredFavorites] = kv.signal<string[]>("command_palette_favorites", [])
  const favorites = createMemo(() => {
    const value = storedFavorites()
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === "string")
  })
  const entries = useKeymapSelector((keymap: OpenTuiKeymap) => {
    const query = {
      namespace: "palette",
    }
    const reachable = keymap.getCommandEntries({
      ...query,
      visibility: "reachable",
      filter: isVisiblePaletteCommand,
    })
    const registeredBindings = keymap.getCommandBindings({
      visibility: "registered",
      commands: reachable.map((entry) => entry.command.name),
    })

    return reachable.map((entry) => ({
      ...entry,
      bindings: registeredBindings.get(entry.command.name) ?? entry.bindings,
    }))
  })
  const options = createMemo(() =>
    entries().map((entry) => {
      const title = typeof entry.command.title === "string" ? entry.command.title : entry.command.name
      const description = typeof entry.command.desc === "string" ? entry.command.desc : undefined
      const category = typeof entry.command.category === "string" ? entry.command.category : undefined
      return {
        title,
        description,
        category,
        keywords: [description, title, category]
          .filter((value) => value !== undefined)
          .map((value) => localizeKnownText("en", value))
          .join(" "),
        footer: formatKeyBindings(entry.bindings, config),
        value: { command: entry.command.name, section: "all" as const },
        suggested: isSuggestedPaletteCommand(entry),
        onSelect: (dialog: DialogContext) => {
          dialog.clear()
          keymap.dispatchCommand(entry.command.name)
        },
      }
    }),
  )
  const available = createMemo(() => new Set(options().map((option) => option.value.command)))

  let ref: DialogSelectRef<PaletteValue>
  const list = () =>
    commandPaletteOptions(options(), favorites(), Boolean(ref?.filter), {
      favorites: i18n.t("tui.favorites"),
      suggested: i18n.t("tui.suggested"),
    })

  function toggleFavorite(value: PaletteValue) {
    const command = value.command
    const current = favorites()
    const next = current.includes(command) ? current.filter((item) => item !== command) : [command, ...current]
    setStoredFavorites(() => next)
  }

  function moveFavorite(value: PaletteValue, direction: -1 | 1) {
    const current = favorites()
    const next = reorderFavorite(value.command, current, direction, (command) => available().has(command))
    if (next === current) return
    setStoredFavorites(() => next)
  }

  function favoriteMoveDisabled(value: PaletteValue | undefined, direction: -1 | 1) {
    if (ref?.filter || value?.section !== "favorite") return true
    return !canReorderFavorite(value.command, favorites(), direction, (command) => available().has(command))
  }

  return (
    <DialogSelect
      ref={(value) => (ref = value)}
      title={i18n.t("tui.commands_title")}
      options={list()}
      preserveSelection={true}
      actions={[
        {
          command: "command.palette.favorite",
          title: i18n.t("dialog.favorite"),
          onTrigger: (option) => toggleFavorite(option.value),
        },
        {
          command: "command.palette.favorite_up",
          title: i18n.t("dialog.favorite_move_up"),
          showInFooter: false,
          disabled: (option) => favoriteMoveDisabled(option?.value, -1),
          onTrigger: (option) => moveFavorite(option.value, -1),
        },
        {
          command: "command.palette.favorite_down",
          title: i18n.t("dialog.favorite_move_down"),
          showInFooter: false,
          disabled: (option) => favoriteMoveDisabled(option?.value, 1),
          onTrigger: (option) => moveFavorite(option.value, 1),
        },
      ]}
    />
  )
}
