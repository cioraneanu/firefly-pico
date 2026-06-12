import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import { startOfMonth, subMonths, getDate, differenceInDays, setDate, addMonths, subDays, startOfDay } from 'date-fns'
import { useProfileStore } from '~/stores/profileStore'
import { useAppStore } from '~/stores/appStore'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useTemplateStore } from '~/stores/templateStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { usePiggyBankStore } from '~/stores/piggyBankStore'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'
import { keyBy, head, uniq, uniqBy } from 'lodash-es'
import AccountRepository from '~/repository/AccountRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import Transaction from '~/models/Transaction'
import Currency from '~/models/Currency.js'
import { convertCurrency, convertTransactionAmountToCurrency, convertTransactionsTotalAmountToCurrency } from '~/utils/CurrencyUtils'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import Tag from '~/models/Tag.js'
import DateUtils from '~/utils/DateUtils.js'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils.js'

export const useDashboardStore = defineStore('dashboard', () => {
  const accountStore = useAccountStore()
  const currencyStore = useCurrencyStore()
  const budgetStore = useBudgetStore()
  const profileStore = useProfileStore()

  const isLoading = ref(false)
  const backendFilters = ref([])
  const month = ref(null)
  const dashboardAccountList = useLocalStorage('dashboardAccountList', [])
  const isLoadingDashboardAccounts = ref(false)
  const transactionsList = ref([])
  const transactionsListLastWeek = ref([])
  const transactionsWithTodo = ref([])
  const tagsWidgetModeOnlyRootTag = useLocalStorage('tagsWidgetModeOnlyRootTag', true)
  const isLoadingTransactions = ref(false)
  const isLoadingTransactionsLastWeek = ref(false)
  const dashboardCurrency = useLocalStorage('dashboardCurrency', null, { serializer: StorageSerializers.object })

  // ----- Getters
  const dashboardAccountDictionary = computed(() => {
    return keyBy(dashboardAccountList.value, 'id')
  })

  const dashboardDateStart = computed(() => {
    const profileStore = useProfileStore()
    if (!month.value) return null
    return setDate(month.value, profileStore.dashboard.firstDayOfMonth)
  })

  const dashboardDateEnd = computed(() => {
    if (!month.value) return null
    return subDays(addMonths(dashboardDateStart.value, 1), 1)
  })

  const dashboardCurrencyCode = computed(() => {
    return Currency.getCode(dashboardCurrency.value)
  })

  // ----- Actions
  async function init() {
    const profileStore = useProfileStore()
    let now = new Date()
    let dashboardMonth = startOfMonth(new Date())
    let monthToSub = getDate(now) < profileStore.dashboard.firstDayOfMonth ? 1 : 0
    month.value = subMonths(dashboardMonth, monthToSub)
  }

  async function fetchTransactionsForInterval() {
    isLoadingTransactions.value = true

    let filtersParts = [`date_after:${DateUtils.dateToString(dashboardDateStart.value)}`, `date_before:${DateUtils.dateToString(dashboardDateEnd.value)}`, ...getExcludedTransactionFilters()]
    filtersParts = [...filtersParts, ...backendFilters.value]
    let filters = [{ field: 'query', value: filtersParts.join(' ') }]
    let searchMethod = new TransactionRepository().searchTransaction
    let list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })

    isLoadingTransactions.value = false
    transactionsList.value = TransactionTransformer.transformFromApiList(list)
  }

  async function fetchTransactionsForWeek() {
    isLoadingTransactionsLastWeek.value = true

    let startDate = DateUtils.dateToString(subDays(startOfDay(new Date()), 7))
    let endDate = DateUtils.dateToString(startOfDay(new Date()))

    let filtersParts = [`date_after:${startDate}`, `date_before:${endDate}`, `type:withdrawal`, ...getExcludedTransactionFilters()]
    filtersParts = [...filtersParts, ...backendFilters.value]
    let filters = [{ field: 'query', value: filtersParts.join(' ') }]
    let searchMethod = new TransactionRepository().searchTransaction
    let list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })

    isLoadingTransactionsLastWeek.value = false
    transactionsListLastWeek.value = TransactionTransformer.transformFromApiList(list)
  }

  async function fetchTransactionsWithTodos() {
    const tagStore = useTagStore()
    const tagTodo = tagStore.tagTodo
    if (!tagTodo) {
      transactionsWithTodo.value = []
      return
    }

    let filters = [
      {
        field: 'query',
        value: `tag_is:"${Tag.getDisplayNameEllipsized(tagTodo)}"`,
      },
    ]
    let list = await new TransactionRepository().searchTransaction({ filters })
    transactionsWithTodo.value = TransactionTransformer.transformFromApiList(list?.data ?? [])
  }

  async function fetchDashboard() {
    const budgetStore = useBudgetStore()
    const piggyBankStore = usePiggyBankStore()
    const recurringTransactionStore = useRecurringTransactionStore()

    await Promise.all([
      fetchDashboardAccounts(),
      fetchTransactionsForInterval(),
      fetchTransactionsForWeek(),
      fetchTransactionsWithTodos(),
      budgetStore.fetchBudgets(),
      piggyBankStore.fetchPiggyBanks(),
      recurringTransactionStore.fetchRecurringTransactions(),
    ])
  }

  async function fetchDashboardAccounts() {
    const currencyStore = useCurrencyStore()
    isLoadingDashboardAccounts.value = true
    let filters = [{ field: 'date', value: DateUtils.dateToString(dashboardDateEnd.value) }]
    let list = await new AccountRepository().getAllWithMerge({ filters })
    const allowedTypes = [Account.types.asset, Account.types.expense, Account.types.revenue, Account.types.liability].map((item) => item.fireflyCode)
    list = list.filter((item) => allowedTypes.includes(item?.attributes?.type) && Account.getIsActive(item))
    dashboardAccountList.value = AccountTransformer.transformFromApiList(list)
    isLoadingDashboardAccounts.value = false

    if (!dashboardCurrency.value?.id) {
      let currencies = list.map((item) => item?.attributes?.currency).filter((item) => !!item)
      dashboardCurrency.value = head(currencies)
    }
  }

  // ----- Computed Statistics
  const dashboardAccounts = computed(() => {
    return (dashboardAccountList.value || []).filter((account) => {
      if (!account) return false
      const isTypeAssetOrLiability = [Account.types.asset.fireflyCode, Account.types.liability.fireflyCode].includes(Account.getType(account)?.fireflyCode)
      return isTypeAssetOrLiability && Account.getIsActive(account) && (Account.getBalance(account) != 0 || profileStore.dashboard.areEmptyAccountsVisible)
    })
  })

  const dashboardAccountsVisible = computed(() => dashboardAccounts.value.filter((item) => item && Account.getIsVisibleOnDashboard(item)))

  const dashboardAccountsInNetWorth = computed(() => dashboardAccounts.value.filter((item) => item && Account.getIsIncludedInNetWorth(item)))

  const dashboardAccountsCurrencyList = computed(() => uniq(dashboardAccountsInNetWorth.value.map((account) => account?.attributes?.currency)))

  const dashboardAccountsGroupsList = computed(() => uniq(dashboardAccountsInNetWorth.value.map((account) => account?.attributes?.group)).filter((item) => !!item))

  const dashboardAccountsTotalByCurrency = computed(() => {
    return dashboardAccountsInNetWorth.value.reduce((result, account) => {
      let accountCurrency = account?.attributes?.currency_code
      const accountBalance = parseFloat(account?.attributes?.current_balance ?? 0)
      let oldValue = result[accountCurrency] ?? 0
      result[accountCurrency] = oldValue + accountBalance
      return result
    }, {})
  })

  const dashboardAccountsEstimatedTotal = computed(() => {
    if (!dashboardCurrency.value) return ' - '

    return Object.keys(dashboardAccountsTotalByCurrency.value)
      .reduce((result, currencyCode) => {
        const currencyAmount = dashboardAccountsTotalByCurrency.value[currencyCode]
        return result + convertCurrency(currencyAmount, currencyCode, Currency.getCode(dashboardCurrency.value))
      }, 0)
      .toFixed(2)
  })

  const dashboardAccountsTotalByGroup = computed(() => {
    return dashboardAccountsInNetWorth.value.reduce((result, account) => {
      let group = account?.attributes?.group
      if (!group) return result
      let accountBalance = parseFloat(account?.attributes?.current_balance ?? 0)
      accountBalance = convertCurrency(accountBalance, Account.getCurrencyCode(account), Currency.getCode(dashboardCurrency.value))

      let oldValue = result[group] ?? 0
      result[group] = oldValue + accountBalance
      return result
    }, {})
  })

  const transactionsListExpense = computed(() => {
    return transactionsList.value.filter((item) => item?.attributes?.transactions?.[0]?.type?.code === Transaction.types.expense.code)
  })

  const transactionsListIncome = computed(() => {
    return transactionsList.value.filter((item) => item?.attributes?.transactions?.[0]?.type?.code === Transaction.types.income.code)
  })

  const transactionsListTransfers = computed(() => {
    return transactionsList.value.filter((item) => item?.attributes?.transactions?.[0]?.type?.code === Transaction.types.transfer.code)
  })

  const dashboardExpensesByCategory = computed(() => {
    return transactionsListExpense.value.reduce((result, transaction) => {
      const splits = Transaction.getSplits(transaction)
      for (let split of splits) {
        const categoryId = split.category_id
        const oldTotal = result[categoryId] ?? 0
        result[categoryId] = oldTotal + convertCurrency(split.amount, split.currency_code, Currency.getCode(dashboardCurrency.value))
      }
      return result
    }, {})
  })

  const dashboardExpensesByTag = computed(() => {
    return transactionsListExpense.value.reduce((result, transaction) => {
      let tags = Transaction.getTags(transaction)
      let rootTag = tags.find((tag) => !tag?.attributes?.parent_id) ?? tags[0]
      let targetTags = tagsWidgetModeOnlyRootTag.value ? [rootTag] : tags
      for (let targetTag of targetTags) {
        let tagId = targetTag?.id ?? 0
        let oldTotal = result[tagId] ?? 0
        result[tagId] = oldTotal + convertTransactionAmountToCurrency(transaction, Currency.getCode(dashboardCurrency.value))
      }
      return result
    }, {})
  })

  const dashboardTransfersByCategory = computed(() => {
    return transactionsListTransfers.value.reduce((result, transaction) => {
      const splits = Transaction.getSplits(transaction)
      for (let split of splits) {
        const categoryId = split.category_id
        const oldTotal = result[categoryId] ?? 0
        result[categoryId] = oldTotal + convertCurrency(split.amount, split.currency_code, Currency.getCode(dashboardCurrency.value))
      }
      return result
    }, {})
  })

  const dashboardTransfersByTag = computed(() => {
    return transactionsListTransfers.value.reduce((result, transaction) => {
      let tags = Transaction.getTags(transaction)
      let rootTag = tags.find((tag) => !tag?.attributes?.parent_id) ?? tags[0]
      let targetTags = tagsWidgetModeOnlyRootTag.value ? [rootTag] : tags
      for (let targetTag of targetTags) {
        let tagId = targetTag?.id ?? 0
        let oldTotal = result[tagId] ?? 0
        result[tagId] = oldTotal + convertTransactionAmountToCurrency(transaction, Currency.getCode(dashboardCurrency.value))
      }
      return result
    }, {})
  })

  const transactionsLatest = computed(() => transactionsList.value.slice(0, 3))

  const dashboardCalendarTransactionsByDate = computed(() => {
    return transactionsList.value.reduce((result, transaction) => {
      const date = DateUtils.dateToString(Transaction.getDate(transaction))
      if (!(date in result)) {
        result[date] = {
          [Transaction.types.expense.code]: 0,
          [Transaction.types.income.code]: 0,
          [Transaction.types.transfer.code]: 0,
        }
      }

      let transactionTypeCode = Transaction.getTypeCode(transaction)
      let amount = convertTransactionAmountToCurrency(transaction, Currency.getCode(dashboardCurrency.value))
      result[date][transactionTypeCode] += amount
      return result
    }, {})
  })

  const dashboardExpenseByDay = computed(() => {
    return transactionsListLastWeek.value.reduce((result, transaction) => {
      const date = DateUtils.dateToString(Transaction.getDate(transaction))
      const oldValue = result[date] ?? 0
      result[date] = oldValue + convertTransactionAmountToCurrency(transaction, Currency.getCode(dashboardCurrency.value))
      return result
    }, {})
  })

  const transactionsListSavingsIn = computed(() => {
    return transactionsList.value.filter((item) => {
      let accountDestinationRoleCode = item?.attributes?.transactions?.[0]?.accountDestination?.attributes?.account_role?.fireflyCode
      return accountDestinationRoleCode === Account.roleAssets.saving.fireflyCode
    })
  })

  const transactionsListSavingsOut = computed(() => {
    return transactionsList.value.filter((item) => {
      let accountSourceRoleCode = item?.attributes?.transactions?.[0]?.accountSource?.attributes?.account_role?.fireflyCode
      return accountSourceRoleCode === Account.roleAssets.saving.fireflyCode
    })
  })

  const transactionsListSavings = computed(() => uniqBy([...transactionsListSavingsIn.value, ...transactionsListSavingsOut.value], 'id'))
  const transactionsListSavingsCount = computed(() => transactionsListSavings.value.length)

  const transactionsListSavingsAmount = computed(() => {
    let amountIn = convertTransactionsTotalAmountToCurrency(transactionsListSavingsIn.value, Currency.getCode(dashboardCurrency.value))
    let amountOut = convertTransactionsTotalAmountToCurrency(transactionsListSavingsOut.value, Currency.getCode(dashboardCurrency.value))
    return amountIn - amountOut
  })

  const totalExpenseThisMonth = computed(() => convertTransactionsTotalAmountToCurrency(transactionsListExpense.value, Currency.getCode(dashboardCurrency.value)))
  const totalIncomeThisMonth = computed(() => convertTransactionsTotalAmountToCurrency(transactionsListIncome.value, Currency.getCode(dashboardCurrency.value)))
  const totalTransfersThisMonth = computed(() => convertTransactionsTotalAmountToCurrency(transactionsListTransfers.value, Currency.getCode(dashboardCurrency.value)))
  const totalSurplusThisMonth = computed(() => totalIncomeThisMonth.value - totalExpenseThisMonth.value)
  const totalTransactionsCount = computed(() => transactionsList.value.length ?? 0)

  const transactionsListSavingsPercentage = computed(() => {
    if (totalIncomeThisMonth.value === 0) return 0
    let percent = ((transactionsListSavingsAmount.value * 1.0) / totalIncomeThisMonth.value) * 100
    return Math.max(percent, 0)
  })

  const budgetLimitTotal = computed(() => {
    return budgetStore.budgetLimitList.reduce((result, budgetLimit) => {
      let budgetAmount = budgetLimit?.attributes?.amount ?? 0
      let budgetCurrencyCode = budgetLimit?.attributes?.currency_code
      return result + convertCurrency(budgetAmount, budgetCurrencyCode, Currency.getCode(dashboardCurrency.value))
    }, 0)
  })

  const budgetLimitSpent = computed(() => {
    return Math.abs(
      budgetStore.budgetLimitList.reduce((result, budgetLimit) => {
        let budgetAmount = budgetLimit?.attributes?.spent ?? 0
        let budgetCurrencyCode = budgetLimit?.attributes?.currency_code
        return result + convertCurrency(budgetAmount, budgetCurrencyCode, Currency.getCode(dashboardCurrency.value))
      }, 0),
    )
  })

  const budgetLimitRemaining = computed(() => budgetLimitTotal.value - budgetLimitSpent.value)

  return {
    isLoading,
    backendFilters,
    month,
    dashboardAccountList,
    isLoadingDashboardAccounts,
    transactionsList,
    transactionsListLastWeek,
    transactionsWithTodo,
    tagsWidgetModeOnlyRootTag,
    dashboardAccountDictionary,
    dashboardDateStart,
    dashboardDateEnd,
    init,
    fetchTransactionsForInterval,
    fetchTransactionsForWeek,
    fetchTransactionsWithTodos,
    fetchDashboardAccounts,
    fetchDashboard,
    isLoadingTransactions,
    isLoadingTransactionsLastWeek,
    // Computed Statistics
    dashboardAccounts,
    dashboardAccountsVisible,
    dashboardAccountsInNetWorth,
    dashboardAccountsCurrencyList,
    dashboardAccountsGroupsList,
    dashboardAccountsTotalByCurrency,
    dashboardAccountsEstimatedTotal,
    dashboardAccountsTotalByGroup,
    transactionsListExpense,
    transactionsListIncome,
    transactionsListTransfers,
    dashboardExpensesByCategory,
    dashboardExpensesByTag,
    dashboardTransfersByCategory,
    dashboardTransfersByTag,
    transactionsLatest,
    dashboardCalendarTransactionsByDate,
    dashboardExpenseByDay,
    transactionsListSavingsIn,
    transactionsListSavingsOut,
    transactionsListSavings,
    transactionsListSavingsCount,
    transactionsListSavingsAmount,
    transactionsListSavingsPercentage,
    totalExpenseThisMonth,
    totalIncomeThisMonth,
    totalTransfersThisMonth,
    totalSurplusThisMonth,
    totalTransactionsCount,
    budgetLimitTotal,
    budgetLimitSpent,
    budgetLimitRemaining,
    dashboardCurrency,
    dashboardCurrencyCode,
  }
})
