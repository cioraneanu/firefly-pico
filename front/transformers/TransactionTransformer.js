import _, { uniq, get } from 'lodash'
import ApiTransformer from './ApiTransformer'
import DateUtils from '~/utils/DateUtils'
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import Transaction from '~/models/Transaction'
import Tag from '~/models/Tag'
import Account from '~/models/Account.js'

export default class TransactionTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    const dataStore = useDataStore()
    const accountsDictionary = dataStore.accountDictionary
    const categoryDictionary = dataStore.categoryDictionary
    const tagDictionaryByName = dataStore.tagDictionaryByName

    item.attributes.transactions = item.attributes.transactions.map((transaction) => {
      /*
        When used with multiple devices, someone can create a category that you don't have locally.
        => show a prompt to resync your extras. There may be edge cases where even after a full resync stuff is still missing...
        Handle that later :-)
      */
      // let hasMissingAccountSource = (transaction['source_id'] && !accountsDictionary[transaction['source_id']])
      // let hasMissingAccountDestination = (transaction['destination_id'] && !accountsDictionary[transaction['destination_id']])
      let hasMissingCategory = transaction['category_id'] && !categoryDictionary[transaction['category_id']]
      let hasMissingTag = false

      transaction.amount = Transaction.formatAmount(_.get(transaction, 'amount', 0))
      transaction.date = DateUtils.autoToDate(transaction.date)
      transaction.accountSource = accountsDictionary[transaction['source_id']]
      transaction.accountDestination = accountsDictionary[transaction['destination_id']]
      transaction.category = categoryDictionary[transaction['category_id']]
      // transaction.tags = TagTransformer.transformFromApiList(transaction.tags.map(tagName => tagDictionaryByName[LanguageUtils.removeAccents(tagName)]))
      transaction.tags = transaction.tags.map((tagName) => {
        hasMissingTag = hasMissingTag || !tagDictionaryByName[LanguageUtils.removeAccents(tagName)]
        return tagDictionaryByName[LanguageUtils.removeAccents(tagName)]
      })

      // let subTransactionType = Transaction.transactionTypeFromFirefly(transaction.type)
      // transaction.type = Transaction.typesList().find(item => item.code === subTransactionType)
      transaction.type = Transaction.typesList.find((item) => item.fireflyCode === transaction.type)

      if (hasMissingCategory || hasMissingTag) {
        dataStore.isSyncRequiredByMissingExtras = true
      }

      return transaction
    })

    return item
  }

  static transformToApi(item) {
    const appStore = useAppStore()

    let id = _.get(item, 'data.id')
    let newTransactions = item.attributes.transactions

    newTransactions = newTransactions.map((item) => {
      // let newItem = cloneDeep(item)
      let newItem = {}
      newItem.amount = _.get(item, 'amount', 0)
      newItem.description = get(item, 'description', '')
      newItem.notes = _.get(item, 'notes')
      newItem.source_id = _.get(item, 'accountSource.id')
      newItem.source_name = Account.getDisplayName(get(item, 'accountSource'))
      newItem.destination_id = _.get(item, 'accountDestination.id')
      newItem.destination_name = Account.getDisplayName(get(item, 'accountDestination'))
      newItem.category_id = _.get(item, 'category.id')
      newItem.date = DateUtils.dateToString(item.date, DateUtils.FORMAT_ENGLISH_DATE_HOUR_MINUTE)

      const source = _.get(item, 'accountSource')
      const destination = _.get(item, 'accountDestination')

      const transactionType = Transaction.getTransactionTypeForAccounts({ source, destination })
      newItem.type = transactionType.fireflyCode

      // const transformedTransactionType = Transaction.transactionTypeToFirefly(transactionType)
      // newItem.type = transformedTransactionType

      let tags = item.tags ?? []
      if (!id && appStore.autoAddedTags && appStore.autoAddedTags.length > 0) {
        tags = [...tags, ...appStore.autoAddedTags]
      }
      tags = tags.map((tag) => Tag.getDisplayName(tag))
      tags = uniq(tags)

      newItem.tags = tags

      return newItem
    })

    return {
      id: id,
      apply_rules: true,
      fire_webhooks: true,
      transactions: newTransactions,
    }
  }
}
