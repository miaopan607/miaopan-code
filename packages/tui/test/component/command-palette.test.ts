import { expect, test } from "bun:test"
import { commandPaletteOptions } from "../../src/component/command-palette"

test("builds favorite, suggested, and complete command sections without deduplication", () => {
  const select = () => {}
  const options = [
    { value: { command: "alpha", section: "all" as const }, suggested: true, onSelect: select },
    { value: { command: "beta", section: "all" as const }, suggested: false, onSelect: select },
    { value: { command: "gamma", section: "all" as const }, suggested: false, onSelect: select },
  ]

  const result = commandPaletteOptions(options, ["beta", "missing"], false, {
    favorites: "Favorites",
    suggested: "Suggested",
  })

  expect(result.map((option) => `${option.value.section}:${option.value.command}`)).toEqual([
    "favorite:beta",
    "suggested:alpha",
    "all:alpha",
    "all:beta",
    "all:gamma",
  ])
  expect(result[0]?.category).toBe("Favorites")
  expect(result[1]?.category).toBe("Suggested")
  expect(result[0]?.onSelect).toBe(select)
  expect(result[1]?.onSelect).toBe(select)
})

test("keeps filtered commands ungrouped", () => {
  const options = [{ value: { command: "alpha", section: "all" as const }, suggested: true }]

  expect(commandPaletteOptions(options, ["alpha"], true, { favorites: "Favorites", suggested: "Suggested" })).toBe(
    options,
  )
})

test("preserves command names that resemble section labels", () => {
  const options = [{ value: { command: "favorite:alpha", section: "all" as const }, suggested: false }]
  const result = commandPaletteOptions(options, ["favorite:alpha"], false, {
    favorites: "Favorites",
    suggested: "Suggested",
  })

  expect(result[0]?.value).toEqual({ command: "favorite:alpha", section: "favorite" })
})
