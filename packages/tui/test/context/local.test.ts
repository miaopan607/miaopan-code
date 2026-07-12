import { expect, test } from "bun:test"
import { parseModel, recentModels, reorderFavorite } from "../../src/context/local"

test("parses model IDs containing slashes", () => {
  expect(parseModel("provider/family/model")).toEqual({
    providerID: "provider",
    modelID: "family/model",
  })
})

test("moves a model to the front, deduplicates, and limits recents", () => {
  const recent = Array.from({ length: 12 }, (_, index) => ({
    providerID: "provider",
    modelID: `model-${index}`,
  }))

  expect(recentModels({ providerID: "provider", modelID: "model-5" }, recent)).toEqual([
    { providerID: "provider", modelID: "model-5" },
    ...recent.slice(0, 5),
    ...recent.slice(6, 10),
  ])
})

test("moves favorite models without mutating the input", () => {
  const favorite = [
    { providerID: "provider", modelID: "one" },
    { providerID: "provider", modelID: "two" },
    { providerID: "provider", modelID: "three" },
  ]

  expect(reorderFavorite(favorite[1], favorite, -1, () => true)).toEqual([favorite[1], favorite[0], favorite[2]])
  expect(reorderFavorite(favorite[1], favorite, 1, () => true)).toEqual([favorite[0], favorite[2], favorite[1]])
  expect(favorite.map((item) => item.modelID)).toEqual(["one", "two", "three"])
})

test("does not move favorite models beyond visible boundaries", () => {
  const favorite = [
    { providerID: "provider", modelID: "one" },
    { providerID: "provider", modelID: "two" },
  ]

  expect(reorderFavorite(favorite[0], favorite, -1, () => true)).toBe(favorite)
  expect(reorderFavorite(favorite[1], favorite, 1, () => true)).toBe(favorite)
  expect(reorderFavorite({ providerID: "provider", modelID: "missing" }, favorite, -1, () => true)).toBe(favorite)
})

test("moves across invalid favorites according to visible order", () => {
  const favorite = [
    { providerID: "provider", modelID: "one" },
    { providerID: "provider", modelID: "removed" },
    { providerID: "provider", modelID: "two" },
  ]
  const isValid = (model: { providerID: string; modelID: string }) => model.modelID !== "removed"

  expect(reorderFavorite(favorite[2], favorite, -1, isValid)).toEqual([favorite[2], favorite[1], favorite[0]])
  expect(reorderFavorite(favorite[0], favorite, 1, isValid)).toEqual([favorite[2], favorite[1], favorite[0]])
  expect(reorderFavorite(favorite[1], favorite, -1, isValid)).toBe(favorite)
})
