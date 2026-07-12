export function reorderFavorite<T>(
  value: T,
  favorite: T[],
  direction: -1 | 1,
  isValid: (value: T) => boolean,
  isSame: (left: T, right: T) => boolean = (left, right) => left === right,
) {
  const indexes = favoriteMoveIndexes(value, favorite, direction, isValid, isSame)
  if (!indexes) return favorite
  return favorite.map((item, itemIndex) => {
    if (itemIndex === indexes[0]) return favorite[indexes[1]]
    if (itemIndex === indexes[1]) return favorite[indexes[0]]
    return item
  })
}

export function canReorderFavorite<T>(
  value: T,
  favorite: T[],
  direction: -1 | 1,
  isValid: (value: T) => boolean,
  isSame: (left: T, right: T) => boolean = (left, right) => left === right,
) {
  return favoriteMoveIndexes(value, favorite, direction, isValid, isSame) !== undefined
}

function favoriteMoveIndexes<T>(
  value: T,
  favorite: T[],
  direction: -1 | 1,
  isValid: (value: T) => boolean,
  isSame: (left: T, right: T) => boolean,
) {
  if (!isValid(value)) return
  const index = favorite.findIndex((item) => isSame(item, value))
  if (index === -1) return
  const target =
    direction === -1
      ? favorite.findLastIndex((item, itemIndex) => itemIndex < index && isValid(item))
      : favorite.findIndex((item, itemIndex) => itemIndex > index && isValid(item))
  if (target !== -1) return [index, target] as const
}
