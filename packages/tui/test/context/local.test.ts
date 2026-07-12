import { expect, test } from "bun:test"
import { getFirstValidModel, parseModel, recentModels } from "../../src/context/local"
import { canReorderFavorite, reorderFavorite } from "../../src/util/favorite"

const sameModel = (left: { providerID: string; modelID: string }, right: { providerID: string; modelID: string }) =>
  left.providerID === right.providerID && left.modelID === right.modelID

test("parses model IDs containing slashes", () => {
  expect(parseModel("provider/family/model")).toEqual({
    providerID: "provider",
    modelID: "family/model",
  })
})

test("keeps the manually selected model when the agent changes", () => {
  const selected = { providerID: "provider", modelID: "selected" }
  const configured = { providerID: "provider", modelID: "configured" }
  const fallback = { providerID: "provider", modelID: "fallback" }

  expect(
    getFirstValidModel(
      () => true,
      () => selected,
      () => configured,
      () => fallback,
    ),
  ).toBe(selected)
})

test("uses the agent model when no model was manually selected", () => {
  const configured = { providerID: "provider", modelID: "configured" }
  const fallback = { providerID: "provider", modelID: "fallback" }

  expect(
    getFirstValidModel(
      () => true,
      () => undefined,
      () => configured,
      () => fallback,
    ),
  ).toBe(configured)
})

test("falls back when the manually selected model is invalid", () => {
  const selected = { providerID: "provider", modelID: "invalid" }
  const configured = { providerID: "provider", modelID: "configured" }
  const fallback = { providerID: "provider", modelID: "fallback" }
  const isValid = (model: { providerID: string; modelID: string }) => model.modelID !== "invalid"

  expect(
    getFirstValidModel(
      isValid,
      () => selected,
      () => configured,
      () => fallback,
    ),
  ).toBe(configured)
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

  expect(reorderFavorite(favorite[1], favorite, -1, () => true, sameModel)).toEqual([
    favorite[1],
    favorite[0],
    favorite[2],
  ])
  expect(reorderFavorite(favorite[1], favorite, 1, () => true, sameModel)).toEqual([
    favorite[0],
    favorite[2],
    favorite[1],
  ])
  expect(favorite.map((item) => item.modelID)).toEqual(["one", "two", "three"])
})

test("does not move favorite models beyond visible boundaries", () => {
  const favorite = [
    { providerID: "provider", modelID: "one" },
    { providerID: "provider", modelID: "two" },
  ]

  expect(reorderFavorite(favorite[0], favorite, -1, () => true, sameModel)).toBe(favorite)
  expect(reorderFavorite(favorite[1], favorite, 1, () => true, sameModel)).toBe(favorite)
  expect(canReorderFavorite(favorite[0], favorite, -1, () => true, sameModel)).toBe(false)
  expect(canReorderFavorite(favorite[1], favorite, -1, () => true, sameModel)).toBe(true)
  expect(reorderFavorite({ providerID: "provider", modelID: "missing" }, favorite, -1, () => true, sameModel)).toBe(
    favorite,
  )
})

test("moves across invalid favorites according to visible order", () => {
  const favorite = [
    { providerID: "provider", modelID: "one" },
    { providerID: "provider", modelID: "removed" },
    { providerID: "provider", modelID: "two" },
  ]
  const isValid = (model: { providerID: string; modelID: string }) => model.modelID !== "removed"

  expect(reorderFavorite(favorite[2], favorite, -1, isValid, sameModel)).toEqual([
    favorite[2],
    favorite[1],
    favorite[0],
  ])
  expect(reorderFavorite(favorite[0], favorite, 1, isValid, sameModel)).toEqual([favorite[2], favorite[1], favorite[0]])
  expect(reorderFavorite(favorite[1], favorite, -1, isValid, sameModel)).toBe(favorite)
})
