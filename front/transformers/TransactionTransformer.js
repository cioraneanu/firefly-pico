import _, { uniq, get } from 'lodash'
import ApiTransformer from './ApiTransformer'
import DateUtils from '~/utils/DateUtils'
import { useProfileStore } from '~/stores/profileStore'
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
      transaction.amountForeign = Transaction.formatAmount(_.get(transaction, 'foreign_amount', 0))
      transaction.foreignCurrencyId = get(transaction, 'foreign_currency_id')
      transaction.foreignCurrency = transaction.foreignCurrencyId ? dataStore.currencyDictionary[transaction.foreignCurrencyId] : null

      transaction.date = DateUtils.autoToDate(transaction.date)
      transaction.accountSource = accountsDictionary[transaction['source_id']]
      transaction.accountDestination = accountsDictionary[transaction['destination_id']]
      transaction.category = categoryDictionary[transaction['category_id']]
      transaction.budget = dataStore.budgetDictionary[transaction['budget_id']]
      // transaction.tags = TagTransformer.transformFromApiList(transaction.tags.map(tagName => tagDictionaryByName[LanguageUtils.removeAccentsAndForceLowerCase(tagName)]))
      transaction.tags = transaction.tags.map((tagName) => {
        hasMissingTag = hasMissingTag || !tagDictionaryByName[LanguageUtils.removeAccentsAndLowerCase(tagName)]
        return tagDictionaryByName[LanguageUtils.removeAccentsAndLowerCase(tagName)]
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
    const profileStore = useProfileStore()

    let id = _.get(item, 'data.id')
    let newTransactions = item.attributes.transactions

    newTransactions = newTransactions.map((item) => {
      const accountSource = _.get(item, 'accountSource')
      const accountDestination = _.get(item, 'accountDestination')

      let newItem = {}
      newItem.amount = _.get(item, 'amount', 0)

      newItem.foreign_amount = _.get(item, 'amountForeign', 0)
      newItem.foreign_currency_id = _.get(item, 'foreignCurrency.id')

      newItem.description = get(item, 'description', '')
      newItem.notes = _.get(item, 'notes')
      newItem.source_id = _.get(item, 'accountSource.id')
      newItem.source_name = Account.getDisplayName(accountSource)
      newItem.destination_id = _.get(item, 'accountDestination.id')
      newItem.destination_name = Account.getDisplayName(accountDestination)
      newItem.category_id = _.get(item, 'category.id') ?? null
      newItem.budget_id = _.get(item, 'budget.id') ?? 0
      newItem.date = DateUtils.dateToString(item.date, DateUtils.FORMAT_ENGLISH_DATE_HOUR_MINUTE)

      const transactionType = Transaction.getTransactionTypeForAccounts({
        source: accountSource,
        destination: accountDestination,
      })
      newItem.type = transactionType.fireflyCode

      // const transformedTransactionType = Transaction.transactionTypeToFirefly(transactionType)
      // newItem.type = transformedTransactionType

      let tags = item.tags ?? []
      if (!id && profileStore.autoAddedTags && profileStore.autoAddedTags.length > 0) {
        tags = [...tags, ...profileStore.autoAddedTags]
      }
      tags = tags.map((tag) => Tag.getDisplayNameEllipsized(tag))
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
