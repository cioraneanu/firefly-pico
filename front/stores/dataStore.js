import { defineStore } from 'pinia'
// import {keyBy} from 'lodash'
import { cloneDeep, get, head, isEqual, keyBy, set, uniq } from 'lodash'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import AccountRepository from '~/repository/AccountRepository'
import CategoryRepository from '~/repository/CategoryRepository'
import TagRepository from '~/repository/TagRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import TransactionTemplateRepository from '~/repository/TransactionTemplateRepository'
import CurrencyRepository from '~/repository/CurrencyRepository'
import { useProfileStore } from '~/stores/profileStore'
import { addMonths, differenceInDays, differenceInHours, getDate, setDate, startOfDay, startOfMonth, subDays, subMonths, subYears } from 'date-fns'
import CategoryTransformer from '~/transformers/CategoryTransformer'
import TagTransformer from '~/transformers/TagTransformer'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'
import Account from '~/models/Account'
import TransactionRepository from '~/repository/TransactionRepository'
import Transaction from '~/models/Transaction'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import { listToTree, setLevel, sortByPath, treeToList } from '~/utils/DataUtils'
import Tag from '~/models/Tag.js'
import { convertCurrency, convertTransactionAmountToCurrency, convertTransactionsTotalAmountToCurrency } from '~/utils/CurrencyUtils'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils.js'
import { uniqBy } from 'lodash/array.js'
import BudgetRepository from '~/repository/BudgetRepository.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetLimitTransformer from '~/transformers/BudgetLimitTransformer.js'
import Currency from '~/models/Currency.js'
import DateUtils from '~/utils/DateUtils.js'
import { startOfTomorrow } from 'date-fns/startOfTomorrow'

export const useDataStore = defineStore('data', {
  state: () => {
    return {
      isLoading: false,

      dashboard: {
        backendFilters: [],
        month: null,
        transactionsList: [],
        transactionsListLastWeek: [],
        transactionsWithTodo: [],
        tagsWidgetModeOnlyRootTag: useLocalStorage('tagsWidgetModeOnlyRootTag', true),
      },

      exchangeRates: useLocalStorage('exchangeRates', {}),
      dashboardCurrency: useLocalStorage('dashboardCurrency', null, { serializer: StorageSerializers.object }),

      transactionTemplateList: useLocalStorage('transactionTemplateList', []), // transactionTemplateList: useLocalStorage('transactionTemplateList', [], TransactionTemplateUtils.getLocalStorageSerializer()),
      categoryList: useLocalStorage('categoryList', []),
      budgetList: useLocalStorage('budgetList', []),
      budgetLimitList: useLocalStorage('budgetLimitList', []),
      accountList: useLocalStorage('accountList', []),
      tagList: useLocalStorage('tagList', []),
      currenciesList: useLocalStorage('currenciesList', []),
      lastSync: useLocalStorage('lastSync', null, {
        serializer: {
          read: (v) => {
            return v ? new Date(v) : null
          },
          write: (v) => {
            return v ? v.toISOString() : null
          },
        },
      }),

      isSyncRequiredByMissingExtras: false,

      isLoadingAccounts: false,
      isLoadingTags: false,
      isLoadingCategories: false,
      isLoadingBudgets: false,
      isLoadingTransactionTemplates: false,
      isLoadingCurrencies: false,
      isLoadingExchangeRates: false,

      isLoadingDashboardTransactions: false,
      isLoadingDashboardTransactionsLastWeek: false,
    }
  },

  getters: {
    dashboardAccounts(state) {
      const profileStore = useProfileStore()
      return state.accountList.filter((account) => {
        const isTypeAssetOrLiability = [Account.types.asset.fireflyCode, Account.types.liability.fireflyCode].includes(Account.getType(account)?.fireflyCode)
        return isTypeAssetOrLiability && Account.getIsActive(account) && (Account.getBalance(account) != 0 || profileStore.dashboard.areEmptyAccountsVisible)
      })
    },

    dashboardAccountsVisible(state) {
      return this.dashboardAccounts.filter((item) => Account.getIsVisibleOnDashboard(item))
    },

    dashboardAccountsInNetWorth(state) {
      return this.dashboardAccounts.filter((item) => Account.getIsIncludedInNetWorth(item))
    },

    dashboardAccountsCurrencyList(state) {
      return uniq(this.dashboardAccountsInNetWorth.map((account) => get(account, 'attributes.currency')))
    },

    dashboardCurrencyCode(state) {
      return Currency.getCode(state.dashboardCurrency)
    },

    dashboardAccountsTotalByCurrency(state) {
      return this.dashboardAccountsInNetWorth.reduce((result, account) => {
        let accountCurrency = get(account, 'attributes.currency_code')
        const accountBalance = parseFloat(get(account, 'attributes.current_balance') ?? 0)
        let oldValue = get(result, accountCurrency, 0)
        set(result, accountCurrency, oldValue + accountBalance)
        return result
      }, {})
    },

    dashboardAccountsEstimatedTotal(state) {
      if (!state.dashboardCurrency) {
        return ' - '
      }

      return Object.keys(this.dashboardAccountsTotalByCurrency)
        .reduce((result, currencyCode) => {
          const currencyAmount = this.dashboardAccountsTotalByCurrency[currencyCode]
          return result + convertCurrency(currencyAmount, currencyCode, Currency.getCode(state.dashboardCurrency))
        }, 0)
        .toFixed(2)
    },

    dashboardExpensesByCategory(state) {
      return this.transactionsListExpense.reduce((result, transaction) => {
        const splits = Transaction.getSplits(transaction)
        for (let split of splits) {
          const categoryId = split.category_id
          const oldTotal = get(result, categoryId, 0)
          result[categoryId] = oldTotal + convertCurrency(split.amount, split.currency_code, Currency.getCode(state.dashboardCurrency))
        }

        return result
      }, {})
    },

    dashboardExpensesByTag(state) {
      return this.transactionsListExpense.reduce((result, transaction) => {
        let tags = Transaction.getTags(transaction)
        let rootTag = tags.find((tag) => !get(tag, 'attributes.parent_id')) ?? head(tags)
        let targetTags = state.dashboard.tagsWidgetModeOnlyRootTag ? [rootTag] : tags
        for (let targetTag of targetTags) {
          let tagId = get(targetTag, 'id', 0)
          let oldTotal = get(result, tagId, 0)
          result[tagId] = oldTotal + convertTransactionAmountToCurrency(transaction, Currency.getCode(state.dashboardCurrency))
        }
        return result
      }, {})
    },

    dashboardTransfersByCategory(state) {
      return this.transactionsListTransfers.reduce((result, transaction) => {
        const splits = Transaction.getSplits(transaction)
        for (let split of splits) {
          const categoryId = split.category_id
          const oldTotal = get(result, categoryId, 0)
          result[categoryId] = oldTotal + convertCurrency(split.amount, split.currency_code, Currency.getCode(state.dashboardCurrency))
        }

        return result
      }, {})
    },

    dashboardTransfersByTag(state) {
      return this.transactionsListTransfers.reduce((result, transaction) => {
        let tags = Transaction.getTags(transaction)
        let rootTag = tags.find((tag) => !get(tag, 'attributes.parent_id')) ?? head(tags)
        let targetTags = state.dashboard.tagsWidgetModeOnlyRootTag ? [rootTag] : tags
        for (let targetTag of targetTags) {
          let tagId = get(targetTag, 'id', 0)
          let oldTotal = get(result, tagId, 0)
          result[tagId] = oldTotal + convertTransactionAmountToCurrency(transaction, Currency.getCode(state.dashboardCurrency))
        }
        return result
      }, {})
    },

    dashboardDateStart(state) {
      const profileStore = useProfileStore()
      if (!state.dashboard.month) {
        return null
      }
      return setDate(state.dashboard.month, profileStore.dashboard.firstDayOfMonth)
    },

    dashboardDateEnd(state) {
      if (!state.dashboard.month) {
        return null
      }
      return subDays(addMonths(this.dashboardDateStart, 1), 1)
    },

    transactionsLatest(state) {
      return state.dashboard.transactionsList.slice(0, 3)
    },

    dashboardCalendarTransactionsByDate(state) {
      return state.dashboard.transactionsList.reduce((result, transaction) => {
        const date = DateUtils.dateToString(Transaction.getDate(transaction))
        if (!(date in result)) {
          result[date] = {
            [Transaction.types.expense.code]: 0,
            [Transaction.types.income.code]: 0,
            [Transaction.types.transfer.code]: 0,
          }
        }

        let transactionTypeCode = Transaction.getTypeCode(transaction)
        let amount = convertTransactionAmountToCurrency(transaction, Currency.getCode(state.dashboardCurrency))
        result[date][transactionTypeCode] += amount

        return result
      }, {})
    },

    dashboardExpenseByDay(state) {
      return state.dashboard.transactionsListLastWeek.reduce((result, transaction) => {
        const date = DateUtils.dateToString(Transaction.getDate(transaction))

        const oldValue = get(result, date, 0)
        result[date] = oldValue + convertTransactionAmountToCurrency(transaction, Currency.getCode(state.dashboardCurrency))

        return result
      }, {})
    },

    transactionsListSavingsIn(state) {
      return state.dashboard.transactionsList.filter((item) => {
        let accountDestinationRoleCode = get(item, 'attributes.transactions.0.accountDestination.attributes.account_role.fireflyCode')
        return accountDestinationRoleCode === Account.roleAssets.saving.fireflyCode
      })
    },

    transactionsListSavingsOut(state) {
      return state.dashboard.transactionsList.filter((item) => {
        let accountSourceRoleCode = get(item, 'attributes.transactions.0.accountSource.attributes.account_role.fireflyCode')
        return accountSourceRoleCode === Account.roleAssets.saving.fireflyCode
      })
    },

    transactionsListSavings(state) {
      return uniqBy([...this.transactionsListSavingsIn, ...this.transactionsListSavingsOut], 'id')
    },

    transactionsListSavingsCount(state) {
      return this.transactionsListSavings.length
    },

    transactionsListSavingsAmount(state) {
      let amountIn = convertTransactionsTotalAmountToCurrency(this.transactionsListSavingsIn, Currency.getCode(state.dashboardCurrency))
      let amountOut = convertTransactionsTotalAmountToCurrency(this.transactionsListSavingsOut, Currency.getCode(state.dashboardCurrency))
      return amountIn - amountOut
    },

    transactionsListSavingsPercentage(state) {
      if (this.totalIncomeThisMonth === 0) {
        return 0
      }
      let percent = ((this.transactionsListSavingsAmount * 1.0) / this.totalIncomeThisMonth) * 100
      return Math.max(percent, 0)
    },

    transactionsListExpense(state) {
      return state.dashboard.transactionsList.filter((item) => get(item, 'attributes.transactions.0.type.code') === Transaction.types.expense.code)
    },

    transactionsListIncome(state) {
      return state.dashboard.transactionsList.filter((item) => get(item, 'attributes.transactions.0.type.code') === Transaction.types.income.code)
    },

    transactionsListTransfers(state) {
      return state.dashboard.transactionsList.filter((item) => get(item, 'attributes.transactions.0.type.code') === Transaction.types.transfer.code)
    },

    totalExpenseThisMonth(state) {
      return convertTransactionsTotalAmountToCurrency(this.transactionsListExpense, Currency.getCode(state.dashboardCurrency))
    },

    totalIncomeThisMonth(state) {
      return convertTransactionsTotalAmountToCurrency(this.transactionsListIncome, Currency.getCode(state.dashboardCurrency))
    },

    totalTransfersThisMonth(state) {
      return convertTransactionsTotalAmountToCurrency(this.transactionsListTransfers, Currency.getCode(state.dashboardCurrency))
    },

    totalSurplusThisMonth(state) {
      return this.totalIncomeThisMonth - this.totalExpenseThisMonth
    },

    totalTransactionsCount(state) {
      return state.dashboard.transactionsList.length ?? 0
    },

    // -------

    // TODO: Actually compute the currency exchanges

    budgetLimitTotal(state) {
      return state.budgetLimitList.reduce((result, budgetLimit) => {
        let budgetAmount = get(budgetLimit, 'attributes.amount') ?? 0
        let budgetCurrencyCode = get(budgetLimit, 'attributes.currency_code')
        return result + convertCurrency(budgetAmount, budgetCurrencyCode, Currency.getCode(state.dashboardCurrency))
      }, 0)
    },

    budgetLimitSpent(state) {
      return Math.abs(
        state.budgetLimitList.reduce((result, budgetLimit) => {
          let budgetAmount = get(budgetLimit, 'attributes.spent') ?? 0
          let budgetCurrencyCode = get(budgetLimit, 'attributes.currency_code')
          return result + convertCurrency(budgetAmount, budgetCurrencyCode, Currency.getCode(state.dashboardCurrency))
        }, 0),
      )
    },
    budgetLimitRemaining(state) {
      return this.budgetLimitTotal - this.budgetLimitSpent
    },

    // -------

    tagTodo(state) {
      return state.tagList.find((tag) => get(tag, 'attributes.is_todo'))
    },

    isLoadingExtras(state) {
      return (
        state.isLoadingCategories ||
        state.isLoadingTags ||
        state.isLoadingTransactionTemplates ||
        state.isLoadingAccounts ||
        state.isLoadingExchangeRates ||
        state.isLoadingCurrencies ||
        state.isLoadingBudgets
      )
    },

    transactionTemplateDictionary: (state) => {
      return keyBy(state.transactionTemplateList, 'id')
    },

    categoryDictionary: (state) => {
      return keyBy(state.categoryList, 'id')
    },

    budgetDictionary: (state) => {
      return keyBy(state.budgetList, 'id')
    },

    budgetLimitDictionary: (state) => {
      return keyBy(state.budgetLimitList, 'attributes.budget_id')
    },

    accountDictionary: (state) => {
      return keyBy(state.accountList, 'id')
    },

    tagDictionaryByName: (state) => {
      return keyBy(state.tagList, (item) => LanguageUtils.removeAccentsAndLowerCase(item.attributes.tag))
    },

    tagDictionaryById: (state) => {
      return keyBy(state.tagList, 'id')
    },

    tagListHierarchy: (state) => {
      let sortedList = sortByPath(state.tagList, 'attributes.tag')
      const tree = listToTree(sortedList)
      return treeToList(tree)
    },

    currencyDictionary: (state) => {
      return keyBy(state.currenciesList, 'id')
    },

    defaultCurrency: (state) => {
      return state.currenciesList.find((item) => get(item, 'attributes.default'))
    },

    exchangeRatesList: (state) => {
      let infoList = get(state.exchangeRates, 'currencies') ?? []
      let infoDictionary = keyBy(infoList, 'code')

      let rates = get(state.exchangeRates, 'rates')
      return Object.keys(rates ?? {}).map((currencyCode) => ({
        code: currencyCode,
        value: rates[currencyCode],
        name: get(infoDictionary, `${currencyCode}.name`, ' - '),
        country: get(infoDictionary, `${currencyCode}.country`, ' - '),
      }))
    },
  },

  actions: {
    async fetchExchangeRate() {
      this.isLoadingExchangeRates = true
      this.exchangeRates = await new CurrencyRepository().getCurrencyExchange()
      this.isLoadingExchangeRates = false
    },

    async fetchTransactionsWithTodos() {
      if (!this.tagTodo) {
        return
      }

      // let filters = [{ field: 'query', value: filtersBackendList.value.join(' ') }]

      let filters = [
        {
          field: 'query',
          value: `tag_is:"${Tag.getDisplayNameEllipsized(this.tagTodo)}"`,
        },
      ]
      let list = await new TransactionRepository().searchTransaction({ filters })
      list = get(list, 'data') ?? []
      this.dashboard.transactionsWithTodo = TransactionTransformer.transformFromApiList(list)
    },

    async fetchDashboardTransactionsForInterval() {
      this.isLoadingDashboardTransactions = true

      let filtersParts = [`date_after:${DateUtils.dateToString(this.dashboardDateStart)}`, `date_before:${DateUtils.dateToString(this.dashboardDateEnd)}`, ...getExcludedTransactionFilters()]
      filtersParts = [...filtersParts, ...this.dashboard.backendFilters]
      let filters = [{ field: 'query', value: filtersParts.join(' ') }]
      let searchMethod = new TransactionRepository().searchTransaction
      let list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })

      this.dashboard.transactionsList = TransactionTransformer.transformFromApiList(list)
      this.isLoadingDashboardTransactions = false
    },

    async fetchDashboardTransactionsForWeek() {
      this.isLoadingDashboardTransactionsLastWeek = true

      let startDate = DateUtils.dateToString(subDays(startOfDay(new Date()), 7))
      let endDate = DateUtils.dateToString(startOfDay(new Date()))

      let filtersParts = [`date_after:${startDate}`, `date_after:${startDate}`, `type:withdrawal`, ...getExcludedTransactionFilters()]
      filtersParts = [...filtersParts, ...this.dashboard.backendFilters]
      let filters = [{ field: 'query', value: filtersParts.join(' ') }]
      let searchMethod = new TransactionRepository().searchTransaction
      let list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })

      this.dashboard.transactionsListLastWeek = TransactionTransformer.transformFromApiList(list)
      this.isLoadingDashboardTransactionsLastWeek = false
    },

    async syncEverythingIfOld() {
      let lastSyncTime = this.lastSync ?? subYears(new Date(), 1)
      let now = new Date()

      const appStore = useAppStore()

      if (differenceInDays(now, lastSyncTime) < appStore.daysBetweenFullSync) {
        return
      }

      this.isLoading = true
      await this.syncEverything()
      this.isLoading = false
    },

    // async syncEverythingIfMissing () {
    //   if (this.isLoadingExtras) {
    //     return
    //   }
    //   let lastSyncTime = this.lastSync ?? subYears(new Date(), 1)
    //   let now = new Date()
    //
    //   if (differenceInMinutes(now, lastSyncTime) < 5) {
    //     return
    //   }
    //
    //   this.isLoading = true
    //   await this.syncEverything()
    //   this.isLoading = false
    // },

    async syncEverything() {
      const appStore = useAppStore()
      if (!appStore.hasAuthToken) {
        return
      }

      let async1 = this.fetchCategories()
      let async2 = this.fetchAccounts()
      let async3 = this.fetchTags()
      let async4 = this.fetchTransactionTemplates()
      let async5 = this.fetchCurrencies()
      let async6 = this.fetchBudgets()
      let async7 = this.fetchExchangeRate()
      let async8 = useProfileStore().getProfiles()
      await Promise.all([async1, async2, async3, async4, async5, async6, async7, async8])

      this.lastSync = new Date()
    },

    async fetchAccounts() {
      this.isLoadingAccounts = true
      let filters = [{ field: 'date', value: DateUtils.dateToString(startOfTomorrow()) }]
      let list = await new AccountRepository().getAllWithMerge({ filters })
      const allowedTypes = [Account.types.asset, Account.types.expense, Account.types.revenue, Account.types.liability].map((item) => item.fireflyCode)
      list = list.filter((item) => allowedTypes.includes(get(item, 'attributes.type')) && Account.getIsActive(item))
      this.accountList = AccountTransformer.transformFromApiList(list)
      this.isLoadingAccounts = false

      if (!this.dashboardCurrency?.id) {
        let currencies = list.map((item) => get(item, 'attributes.currency')).filter((item) => !!item)
        this.dashboardCurrency = head(currencies)
      }
    },

    async fetchCategories() {
      this.isLoadingCategories = true
      const list = await new CategoryRepository().getAllWithMerge()
      this.categoryList = CategoryTransformer.transformFromApiList(list)
      this.isLoadingCategories = false
    },

    async fetchBudgets() {
      this.isLoadingBudgets = true

      const asyncBudget = new BudgetRepository().getAllWithMerge()
      let fetchBudgetLimits = new BudgetRepository().getBudgetLimits
      let asyncBudgetLimit = new BudgetRepository().getAllWithMerge({ getAll: fetchBudgetLimits })

      const [budgetList, budgetLimitList] = await Promise.all([asyncBudget, asyncBudgetLimit])

      this.budgetList = BudgetTransformer.transformFromApiList(budgetList)
      this.budgetLimitList = BudgetLimitTransformer.transformFromApiList(budgetLimitList)

      this.isLoadingBudgets = false
    },

    async fetchTags() {
      this.isLoadingTags = true
      const list = await new TagRepository().getAllWithMerge()
      this.tagList = TagTransformer.transformFromApiList(list)

      let newTags = cloneDeep(this.tagList)
      setLevel(newTags)
      this.isLoadingTags = false
    },

    async fetchTransactionTemplates() {
      this.isLoadingTransactionTemplates = true
      const list = await new TransactionTemplateRepository().getAllWithMerge()
      this.transactionTemplateList = TransactionTemplateTransformer.transformFromApiList(list)
      this.isLoadingTransactionTemplates = false
    },

    async fetchCurrencies() {
      this.isLoadingCurrencies = true
      this.currenciesList = await new CurrencyRepository().getAllWithMerge()
      this.isLoadingCurrencies = false
    },

    async init() {
      let profileStore = useProfileStore()
      let now = new Date()
      let dashboardMonth = startOfMonth(new Date())
      let monthToSub = getDate(now) < profileStore.dashboard.firstDayOfMonth ? 1 : 0
      this.dashboard.month = subMonths(dashboardMonth, monthToSub)
    },

    // -----

    async fetchDashboard() {
      this.fetchAccounts()
      this.fetchDashboardTransactionsForInterval()
      this.fetchDashboardTransactionsForWeek()
      this.fetchTransactionsWithTodos()
      this.fetchExchangeRate()
      this.fetchBudgets()
    },

    // -----
  },
})
