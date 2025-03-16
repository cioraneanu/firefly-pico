import { get, isEqual } from 'lodash'
import Transaction from '~/models/Transaction'

export function migrateType(value, list, compareKey = 'code') {
  if (!value) {
    return
  }

  return list.find(item => get(item, compareKey) === get(value, compareKey))
}
