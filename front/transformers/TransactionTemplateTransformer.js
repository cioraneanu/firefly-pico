import { cloneDeep, get } from 'lodash'
import ApiTransformer from './ApiTransformer'
import { useDataStore } from '~/stores/dataStore'
import Transaction from '~/models/Transaction'

export default class TransactionTemplateTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    const dataStore = useDataStore()
    const accountsDictionary = dataStore.accountDictionary
    const categoryDictionary = dataStore.categoryDictionary
    const tagDictionaryById = dataStore.tagDictionaryById

    item.amount = Transaction.formatAmount(get(item, 'amount', 0))

    // item.date = DateUtils.autoToDate(item.date)
    item.account_source = accountsDictionary[item['account_source_id']]
    item.account_destination = accountsDictionary[item['account_destination_id']]
    item.category = categoryDictionary[item['category_id']]
    item.tags = (item.tags ?? []).map((transactionTemplateTag) => tagDictionaryById[transactionTemplateTag.tag_id])
    item.extra_names = get(item, 'extra_names', []).map((item) => {
      return {
        value: item.name,
      }
    })

    item.type = Transaction.typesList.find((type) => type.fireflyCode === item.type)
    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    const source = get(item, 'account_source')
    const destination = get(item, 'account_destination')
    // const transactionType = Transaction.getTransactionTypeForAccounts({ source, destination })
    const transactionType = get(item, 'type')

    return {
      id: get(item, 'id'),
      name: get(item, 'name'),
      extra_names: (item.extra_names ?? []).map((item) => item.value),
      amount: get(item, 'amount'),
      description: get(item, 'description'),
      notes: get(item, 'notes'),
      account_source_id: get(item, 'account_source.id'),
      account_destination_id: get(item, 'account_destination.id'),
      category_id: get(item, 'category.id') ?? null,
      tags: (item.tags ?? []).map((item) => item.id),
      type: get(transactionType, 'fireflyCode'),
      // tags
    }
  }
}
