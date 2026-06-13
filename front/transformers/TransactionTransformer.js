import { get, uniq } from 'lodash-es'
import ApiTransformer from './ApiTransformer'
import DateUtils from '~/utils/DateUtils'
import LanguageUtils from '~/utils/LanguageUtils.js'
import { useProfileStore } from '~/stores/profileStore'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { usePiggyBankStore } from '~/stores/piggyBankStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import Transaction from '~/models/Transaction'
import Tag from '~/models/Tag'
import Account from '~/models/Account.js'
import { useAppStore } from '~/stores/appStore.js'

export default class TransactionTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    const appStore = useAppStore()
    const accountDictionary = useAccountStore().accountDictionary
    const categoryDictionary = useCategoryStore().categoryDictionary
    const tagDictionaryByName = useTagStore().tagDictionaryByName
    const budgetDictionary = useBudgetStore().budgetDictionary
    const piggyBankDictionary = usePiggyBankStore().piggyBankDictionary
    const currencyDictionary = useCurrencyStore().currencyDictionary

    item.attributes.transactions = item.attributes.transactions.map((transaction) => {
      const currencyId = get(transaction, 'currency_id')
      const currencyForeignId = get(transaction, 'foreign_currency_id')
      transaction.currency = currencyId ? currencyDictionary[currencyId] : null
      transaction.currencyForeign = currencyForeignId ? currencyDictionary[currencyForeignId] : null

      transaction.amount = Transaction.formatAmountForCurrency(transaction?.amount, transaction.currency)
      transaction.amountForeign = Transaction.formatAmountForCurrency(transaction?.foreign_amount, transaction.currencyForeign)
      transaction.date = DateUtils.autoToDate(transaction.date)
      transaction.accountSource = accountDictionary[transaction['source_id']]
      transaction.accountDestination = accountDictionary[transaction['destination_id']]
      transaction.category = categoryDictionary[transaction['category_id']]
      transaction.budget = budgetDictionary[transaction['budget_id']]
      // Firefly III does not return "piggy_bank_id" on reads, but map it in case it ever does
      transaction.piggyBank = piggyBankDictionary[transaction['piggy_bank_id']]
      transaction.type = Transaction.typesList.find((type) => type.fireflyCode === transaction.type)

      transaction.tags = transaction.tags.map((tagName) => tagDictionaryByName[LanguageUtils.removeAccentsAndLowerCase(tagName)])

      const hasMissingCategory = transaction['category_id'] && !transaction.category
      const hasMissingTag = transaction.tags.some((tag) => !tag)
      if (hasMissingCategory || hasMissingTag) {
        appStore.isSyncRequiredByMissingExtras = true
      }

      return transaction
    })

    return item
  }

  static transformToApi(item) {
    const profileStore = useProfileStore()
    const id = get(item, 'data.id')

    const transactions = item.attributes.transactions.map((transaction) => {
      const accountSource = get(transaction, 'accountSource')
      const accountDestination = get(transaction, 'accountDestination')

      const newItem = {
        amount: get(transaction, 'amount', 0),
        description: get(transaction, 'description', ''),
        notes: get(transaction, 'notes'),
        source_id: get(accountSource, 'id'),
        source_name: Account.getDisplayName(accountSource),
        destination_id: get(accountDestination, 'id'),
        destination_name: Account.getDisplayName(accountDestination),
        category_id: get(transaction, 'category.id') ?? null,
        budget_id: get(transaction, 'budget.id') ?? 0,
        date: DateUtils.dateToString(transaction.date, DateUtils.FORMAT_ENGLISH_DATE_HOUR_MINUTE),
        type: Transaction.getTransactionTypeForAccounts({ source: accountSource, destination: accountDestination }).fireflyCode,
      }

      const foreignAmount = get(transaction, 'amountForeign', 0)
      const foreignCurrencyId = get(transaction, 'currencyForeign.id')
      if (foreignAmount > 0 && foreignCurrencyId) {
        newItem.foreign_amount = foreignAmount
        newItem.foreign_currency_id = foreignCurrencyId
      }

      const piggyBankId = get(transaction, 'piggyBank.id')
      if (piggyBankId) {
        newItem.piggy_bank_id = piggyBankId
      }

      // Auto-added tags only apply to brand new transactions (no id yet)
      let tags = transaction.tags ?? []
      if (!id && profileStore.autoAddedTags?.length > 0) {
        tags = [...tags, ...profileStore.autoAddedTags]
      }
      newItem.tags = uniq(tags.map((tag) => Tag.getDisplayNameEllipsized(tag)))

      return newItem
    })

    return {
      id,
      apply_rules: true,
      fire_webhooks: true,
      transactions,
    }
  }
}
