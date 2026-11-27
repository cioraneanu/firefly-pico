import { get } from 'lodash-es'
import ApiTransformer from '~/core/transformers/ApiTransformer'
import Icon from '~/core/models/Icon.js'
import DateUtils from '~/core/utils/DateUtils'
import { useCurrencyStore } from '~/core/stores/currencyStore'

export default class SubscriptionTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    const currencyStore = useCurrencyStore()
    const attributes = item.attributes

    attributes.icon = Icon.getIcon(get(attributes, 'icon'))
    attributes.currency = currencyStore.currencyDictionary[get(attributes, 'currency_id')]
    ;['date', 'end_date', 'extension_date', 'next_expected_match'].forEach((field) => (attributes[field] = DateUtils.autoToDate(get(attributes, field))))
    attributes.pay_dates = (get(attributes, 'pay_dates') ?? []).map((date) => DateUtils.autoToDate(date))
    attributes.paid_dates = (get(attributes, 'paid_dates') ?? []).map((paidDate) => ({ ...paidDate, date: DateUtils.autoToDate(paidDate.date) }))

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }
    const data = get(item, 'attributes')

    return {
      name: get(data, 'name', ''),
      icon: get(data, 'icon.icon'),
      amount_min: String(get(data, 'amount_min') ?? ''),
      amount_max: String(get(data, 'amount_max') ?? ''),
      currency_id: get(data, 'currency.id'),
      date: DateUtils.dateToString(get(data, 'date')),
      end_date: DateUtils.dateToString(get(data, 'end_date')),
      extension_date: DateUtils.dateToString(get(data, 'extension_date')),
      repeat_freq: get(data, 'repeat_freq'),
      skip: parseInt(get(data, 'skip')) || 0,
      active: !!get(data, 'active'),
      notes: get(data, 'notes'),
    }
  }
}
