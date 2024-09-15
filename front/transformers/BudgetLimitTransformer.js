import _, { get } from 'lodash'
import DateUtils from '~/utils/DateUtils'
import Account from '~/models/Account'
import Utils from '~/utils/Utils'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'
import Budget from '~/models/Budget.js'
import { useDataStore } from '~/stores/dataStore.js'

export default class BudgetLimitTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    item.attributes.spent = parseFloat(get(item, 'attributes.spent') ?? "0")
    item.attributes.amount = parseFloat(get(item, 'attributes.amount') ?? "0")

    item.attributes.percent = item.attributes.spent === 0 ? 0 : (Math.abs(item.attributes.spent) * 100.0) / item.attributes.amount
    item.attributes.remaining = item.attributes.amount + item.attributes.spent

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    return item
  }
}
