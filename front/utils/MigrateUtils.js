import { get, isEqual } from 'lodash'
import Transaction from '~/models/Transaction'

// TODO: Maybe make these functions return {shouldMigrate: true, value: x} so we can avoid unnecesary localStorage updates
export function migrateType(value, list, compareKey = 'code') {
  if (!value) {
    return
  }

  return list.find((item) => get(item, compareKey) === get(value, compareKey))
}

export function migrateTypeList(userList, targetList, compareKey = 'code') {
  if (userList.length !== targetList.length) {
    return targetList
  }
  let newList = userList
    .map((userItem) => {
      let defaultItem = targetList.find((targetItem) => targetItem.code === userItem.code)
      // We added new keys like "t" in the default item and we want to preserve user choice like "userItem.isVisible"
      return { ...defaultItem, ...userItem }
    })
    .filter((item) => !!item)

  return userList.length === targetList.length ? newList : targetList
}
