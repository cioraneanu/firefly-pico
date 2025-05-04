import _, { get } from 'lodash'
import DateUtils from '~/utils/DateUtils'
import Account from '~/models/Account'
import Utils from '~/utils/Utils'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'
import Budget from '~/models/Budget.js'
import { useDataStore } from '~/stores/dataStore.js'

export default class BudgetTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    const dataStore = useDataStore()

    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))
    item.attributes.auto_budget_type = Budget.typesList().find((type) => type.fireflyCode === item.attributes.auto_budget_type)
    item.attributes.auto_budget_period = Budget.periodsList().find((type) => type.fireflyCode === item.attributes.auto_budget_period)
    item.attributes.currency = dataStore.currencyDictionary[get(item, 'attributes.currency_id')]
    item.attributes.amount = get(item, 'attributes.auto_budget_amount')

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    let budgetTypeCode = get(data, 'auto_budget_type.fireflyCode')
    let hasPeriod = budgetTypeCode !== Budget.types.manual.fireflyCode

    let result = {
      name: get(data, 'name', ''),
      icon: get(data, 'icon.icon'),
      active: get(data, 'active'),
      auto_budget_type: budgetTypeCode,
    }

    if (hasPeriod) {
      result = {
        ...result,
        auto_budget_period: get(data, 'auto_budget_period.fireflyCode'),
        auto_budget_currency_id: get(data, 'currency.id'),
        auto_budget_amount: get(data, 'amount'),
      }
    }

    return result
  }
}
