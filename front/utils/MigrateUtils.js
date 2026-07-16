import { get, isEqual } from 'lodash-es'
import Transaction from '~/models/Transaction'

// TODO: Maybe make these functions return {shouldMigrate: true, value: x} so we can avoid unnecesary localStorage updates
export function migrateType(value, list, compareKey = 'code') {
  if (!value) {
    return
  }

  return list.find((item) => get(item, compareKey) === get(value, compareKey))
}

export function migrateTypeList(userList, targetList, compareKey = 'code') {
  if (!Array.isArray(userList)) {
    return targetList
  }

  // Keep the user's order and choices (like "isVisible"), drop items no longer in the target list
  let newList = userList
    .filter((userItem) => targetList.some((targetItem) => get(targetItem, compareKey) === get(userItem, compareKey)))
    .map((userItem) => {
      let defaultItem = targetList.find((targetItem) => get(targetItem, compareKey) === get(userItem, compareKey))
      // We added new keys like "t" in the default item and we want to preserve user choice like "userItem.isVisible"
      return { ...defaultItem, ...userItem }
    })

  // Append newly added items with their default settings
  let missingItems = targetList.filter((targetItem) => !userList.some((userItem) => get(userItem, compareKey) === get(targetItem, compareKey)))
  return [...newList, ...missingItems]
}
