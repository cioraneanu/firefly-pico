import _, { get } from 'lodash'
import Account from '~/models/Account'
import ApiTransformer from '~/transformers/ApiTransformer'
import { useDataStore } from '~/stores/dataStore'
import Icon from '~/models/Icon.js'
import { startOfMonth } from 'date-fns'

export default class AccountTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    const dataStore = useDataStore()
    const currencyDictionary = dataStore.currencyDictionary

    // Utils.stringToData(item, 'attributes.account_role', Account.roleAssetsList)
    // Utils.stringToData(item, 'attributes.type', Account.typesList)

    item.attributes.account_role = Account.roleAssetsList().find((role) => role.fireflyCode === item.attributes.account_role)
    item.attributes.type = Account.typesList().find((type) => type.fireflyCode === item.attributes.type)

    let currencyId = get(item, 'attributes.currency_id')
    item.attributes.currency = currencyDictionary[currencyId]
    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))

    item.attributes.is_dashboard_visible = get(item, 'attributes.is_dashboard_visible', true)

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    let creditCardType = get(data, 'credit_card_type') ?? Account.creditCardPaymentPlans.monthlyFull
    let monthlyPaymentDate = get(data, 'monthly_payment_date') ?? DateUtils.dateToString(startOfMonth(new Date()), DateUtils.FORMAT_ENGLISH_DATE)

    // Some accounts can have 0 opening balance and null date.
    const { opening_balance, opening_balance_date } = data
    const openingBalance = opening_balance_date ? { opening_balance, opening_balance_date } : {}

    return {
      name: get(data, 'name', ''),
      icon: get(data, 'icon.icon'),
      type: get(data, 'type.fireflyCode'),
      account_role: get(data, 'account_role.fireflyCode'),
      credit_card_type: creditCardType,
      monthly_payment_date: monthlyPaymentDate,
      currency_id: get(data, 'currency.id'),
      currency_code: get(data, 'currency.attributes.code'),

      include_net_worth: get(data, 'include_net_worth', false),
      is_dashboard_visible: get(data, 'is_dashboard_visible', true),

      ...openingBalance,
    }
  }
}
