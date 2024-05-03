import _, { cloneDeep, get } from 'lodash'
import ApiTransformer from './ApiTransformer'
import { useDataStore } from '~/stores/dataStore'
import Transaction from '~/models/Transaction'

export default class TransactionTemplateTransformer extends ApiTransformer {

  static transformFromApi (item) {
    if (!item) {
      return null
    }

    const dataStore = useDataStore()
    const accountsDictionary = dataStore.accountDictionary
    const categoryDictionary = dataStore.categoryDictionary
    const tagDictionaryById = dataStore.tagDictionaryById

    item.amount = Transaction.formatAmount(_.get(item, 'amount', 0))

    // item.date = DateUtils.autoToDate(item.date)
    item.account_source = accountsDictionary[item['account_source_id']]
    item.account_destination = accountsDictionary[item['account_destination_id']]
    item.category = categoryDictionary[item['category_id']]
    item.tags = (item.tags ?? []).map(transactionTemplateTag => tagDictionaryById[transactionTemplateTag.tag_id])
    item.extra_names = get(item, 'extra_names', []).map(item => {
      return {
        value: item.name,
      }
    })

    item.type = Transaction.typesList.find(type =>  type.fireflyCode === item.type)
    return item
  }

  static transformToApi (item) {
    if (!item) {
      return null
    }

    const source = _.get(item, 'account_source')
    const destination = _.get(item, 'account_destination')
    const transactionType = Transaction.getTransactionTypeForAccounts({ source, destination })

    return {
      id: _.get(item, 'id'),
      name: _.get(item, 'name'),
      extra_names: (item.extra_names ?? []).map(item => item.value),
      amount: _.get(item, 'amount'),
      description: _.get(item, 'description'),
      notes: _.get(item, 'notes'),
      account_source_id: _.get(item, 'account_source.id'),
      account_destination_id: _.get(item, 'account_destination.id'),
      category_id: _.get(item, 'category.id'),
      tags: (item.tags ?? []).map(item => item.id),
      type: get(transactionType, 'fireflyCode'),
      // tags
    }

  }
}