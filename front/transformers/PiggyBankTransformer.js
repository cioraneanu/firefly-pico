import _, { get } from 'lodash-es'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'
import DateUtils from '~/utils/DateUtils'
import { useAccountStore } from '~/stores/accountStore'
import { useCurrencyStore } from '~/stores/currencyStore'

export default class PiggyBankTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    const accountStore = useAccountStore()
    const currencyStore = useCurrencyStore()

    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))

    // Firefly III >= 6.2 returns a list of linked accounts, older versions a single "account_id"
    const accountId = get(item, 'attributes.accounts.0.account_id') ?? get(item, 'attributes.account_id')
    item.attributes.account = accountStore.accountDictionary[accountId]
    item.attributes.currency = currencyStore.currencyDictionary[get(item, 'attributes.currency_id')]
    item.attributes.start_date = DateUtils.autoToDate(get(item, 'attributes.start_date'))
    item.attributes.target_date = DateUtils.autoToDate(get(item, 'attributes.target_date'))

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    let accountId = get(data, 'account.id')
    let currentAmount = get(data, 'current_amount')
    let hasCurrentAmount = currentAmount !== null && currentAmount !== undefined && currentAmount !== ''

    let result = {
      name: get(data, 'name', ''),
      icon: get(data, 'icon.icon'),
      target_amount: get(data, 'target_amount') || '0',
      start_date: DateUtils.dateToString(get(data, 'start_date')),
      target_date: DateUtils.dateToString(get(data, 'target_date')),
      notes: get(data, 'notes'),
      // Firefly III >= 6.2 links piggy banks to multiple accounts, older versions to a single "account_id".
      // Send both so each version picks up the fields it knows about.
      accounts: [{ account_id: accountId, ...(hasCurrentAmount ? { current_amount: currentAmount } : {}) }],
      account_id: accountId,
      transaction_currency_id: get(data, 'account.attributes.currency_id'),
    }

    if (hasCurrentAmount) {
      result.current_amount = currentAmount
    }

    return result
  }
}
