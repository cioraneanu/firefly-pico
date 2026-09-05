import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import { startOfMonth, subMonths, getDate, differenceInDays, differenceInCalendarDays, setDate, addMonths, subDays, startOfDay } from 'date-fns'
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
import Budget from '~/models/Budget.js'
import Currency from '~/models/Currency.js'
import { convertCurrency, convertTransactionAmountToCurrency, convertTransactionsTotalAmountToCurrency } from '~/utils/CurrencyUtils'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import Tag from '~/models/Tag.js'
import DateUtils from '~/utils/DateUtils.js'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { useListFilters } from '~/composables/useListFilters.js'
import { DASHBOARD_BUDGET_PACE_TOP_N, DASHBOARD_PROJECTION_HISTORY_MONTHS } from '~/constants/DashboardConstants.js'
// Pure, store-free math with no coupling to analyticsStore or the analytics page — reused here
// rather than re-implemented, same as any other shared util.
import { quartiles, rankTopNWithOther } from '~/utils/AnalyticsUtils.js'
import { seriesColor } from '~/utils/ChartUtils.js'

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
  const widgetsNetAmountMode = useLocalStorage('widgetsNetAmountMode', false)
  const isLoadingTransactions = ref(false)
  const isLoadingTransactionsLastWeek = ref(false)
  const dashboardCurrency = useLocalStorage('dashboardCurrency', null, { serializer: StorageSerializers.object })
  // Trailing complete months' total expense, in dashboardCurrency — backs Month projection's
  // "vs. historical average" comparison. Not part of transactionsList (that's this month only),
  // so it's the one new fetch this widget pair needs; see fetchHistoricalMonthlyExpenseTotals.
  const historicalMonthlyExpenseTotals = ref([])
  const isLoadingHistoricalMonthlyExpenseTotals = ref(false)

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

  // Trailing DASHBOARD_PROJECTION_HISTORY_MONTHS complete months' total expense, one request per
  // month (same query shape as fetchTransactionsForInterval, incl. exclusions and the manual
  // filter popup) — a full MonthlyFact per month would be overkill for a single number, so this
  // reuses convertTransactionsTotalAmountToCurrency (the same helper totalExpenseThisMonth already
  // uses) instead of a per-split reduction.
  async function fetchHistoricalMonthlyExpenseTotals() {
    if (!dashboardDateStart.value) return
    isLoadingHistoricalMonthlyExpenseTotals.value = true
    try {
      const totals = await Promise.all(
        Array.from({ length: DASHBOARD_PROJECTION_HISTORY_MONTHS }, (_, i) => i + 1).map(async (monthsBack) => {
          const monthStart = subMonths(dashboardDateStart.value, monthsBack)
          const monthEnd = subDays(addMonths(monthStart, 1), 1)
          const filtersParts = [
            `date_after:${DateUtils.dateToString(monthStart)}`,
            `date_before:${DateUtils.dateToString(monthEnd)}`,
            'type:withdrawal',
            ...getExcludedTransactionFilters(),
            ...backendFilters.value,
          ]
          const filters = [{ field: 'query', value: filtersParts.join(' ') }]
          const searchMethod = new TransactionRepository().searchTransaction
          const list = await new TransactionRepository().getAllWithMerge({ filters, getAll: searchMethod })
          const transactions = TransactionTransformer.transformFromApiList(list)
          return convertTransactionsTotalAmountToCurrency(transactions, Currency.getCode(dashboardCurrency.value))
        }),
      )
      historicalMonthlyExpenseTotals.value = totals
    } finally {
      isLoadingHistoricalMonthlyExpenseTotals.value = false
    }
  }

  async function fetchTransactionsWithTodos() {
    const tagStore = useTagStore()
    const tagTodo = tagStore.tagTodo
    if (!tagTodo) {
      transactionsWithTodo.value = []
      return
    }

    const { filters, filtersBackendList } = useListFilters({
      filterDefinitions: Object.values(TransactionFilterUtils.filters),
    })

    filters.value = {
      ...TransactionFilterUtils.getPredefinedFilters(),
      tag: tagTodo,
    }
    const requestFilters = [{ field: 'query', value: filtersBackendList.value.join(' ') }]

    let list = await new TransactionRepository().searchTransaction({ filters: requestFilters })
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
    const transactions = widgetsNetAmountMode.value ? [...transactionsListExpense.value, ...transactionsListIncome.value] : transactionsListExpense.value
    const totals = transactions.reduce((result, transaction) => {
      const multiplier = Transaction.getTypeCode(transaction) === Transaction.types.income.code ? -1 : 1
      const splits = Transaction.getSplits(transaction)
      for (let split of splits) {
        const categoryId = split.category_id
        const oldTotal = result[categoryId] ?? 0
        result[categoryId] = oldTotal + multiplier * convertCurrency(split.amount, split.currency_code, Currency.getCode(dashboardCurrency.value))
      }
      return result
    }, {})

    if (!widgetsNetAmountMode.value) return totals

    return Object.keys(totals).reduce((result, categoryId) => {
      if (totals[categoryId] > 0) {
        result[categoryId] = totals[categoryId]
      }
      return result
    }, {})
  })

  const dashboardExpensesByTag = computed(() => {
    const transactions = widgetsNetAmountMode.value ? [...transactionsListExpense.value, ...transactionsListIncome.value] : transactionsListExpense.value
    const totals = transactions.reduce((result, transaction) => {
      const multiplier = Transaction.getTypeCode(transaction) === Transaction.types.income.code ? -1 : 1
      let tags = Transaction.getTags(transaction)
      let rootTag = tags.find((tag) => !tag?.attributes?.parent_id) ?? tags[0]
      let targetTags = tagsWidgetModeOnlyRootTag.value ? [rootTag] : tags
      for (let targetTag of targetTags) {
        let tagId = targetTag?.id ?? 0
        let oldTotal = result[tagId] ?? 0
        result[tagId] = oldTotal + multiplier * convertTransactionAmountToCurrency(transaction, Currency.getCode(dashboardCurrency.value))
      }
      return result
    }, {})

    if (!widgetsNetAmountMode.value) return totals

    return Object.keys(totals).reduce((result, tagId) => {
      if (totals[tagId] > 0) {
        result[tagId] = totals[tagId]
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

  // "Today", clipped to the shown month's own end — lets both budgetPace and monthProjection
  // degrade correctly when the user has swiped to a past month (today > dashboardDateEnd), rather
  // than assuming "today" always falls inside the period like the Analytics-page originals did
  // (Analytics has no month navigation, so that assumption held there but doesn't here).
  const dashboardPeriodCursor = computed(() => {
    if (!dashboardDateEnd.value) return null
    const today = new Date()
    return today < dashboardDateEnd.value ? today : dashboardDateEnd.value
  })

  // Cumulative day-by-day spend against each budget's limit, one line per top-N active budget +
  // "Other" — the Home-native replacement for analytics-budgets-burn-rate.vue. Reads straight from
  // transactionsList/budgetStore.budgetList, both already fetched by fetchDashboard() for whatever
  // month/filter Home is currently showing, so this needs no fetch of its own. "Spent" is computed
  // per-split from transactionsList (respects the manual filter popup) rather than trusting
  // Budget.getLimit()'s own attributes.spent (Firefly's server-side figure, which dashboard-budgets.vue
  // uses and which does NOT pass through the manual filter) — the two budget widgets can therefore
  // disagree while a manual filter is active; that's expected, not a bug.
  const budgetPace = computed(() => {
    const start = dashboardDateStart.value
    const cursor = dashboardPeriodCursor.value
    if (!start || !cursor || !dashboardDateEnd.value) return { totalDays: 0, daysInMonth: 0, series: [], isEligible: false, periodStart: start }
    // The full month length, NOT the number of days plotted (cursor may fall short of month end
    // for a still-in-progress month) — the ideal-pace diagonal must reach 100% at month end, not
    // at "today", so this is exposed separately from totalDays for app-chart-multiline to draw the
    // line against the true period length rather than the plotted window.
    const daysInMonth = differenceInCalendarDays(dashboardDateEnd.value, start) + 1

    const eligibleBudgets = budgetStore.budgetList.filter((budget) => Budget.isActive(budget) && (Budget.getLimit(budget)?.attributes?.amount ?? 0) > 0)
    if (eligibleBudgets.length === 0) return { totalDays: 0, daysInMonth, series: [], isEligible: false, periodStart: start }

    const limitById = Object.fromEntries(
      eligibleBudgets.map((budget) => {
        const limit = Budget.getLimit(budget)
        return [budget.id, convertCurrency(limit?.attributes?.amount ?? 0, limit?.attributes?.currency_code, Currency.getCode(dashboardCurrency.value))]
      }),
    )
    const { topIds, otherIds } = rankTopNWithOther(limitById, DASHBOARD_BUDGET_PACE_TOP_N)
    const topBudgets = topIds.map((id) => eligibleBudgets.find((b) => String(b.id) === String(id)))
    const otherBudgets = otherIds.map((id) => eligibleBudgets.find((b) => String(b.id) === String(id)))

    const totalDays = Math.max(1, differenceInCalendarDays(cursor, start) + 1)
    const dayTotals = {} // budgetId -> [day0Amount, day1Amount, ...], in that budget's own currency
    for (const budget of [...topBudgets, ...otherBudgets]) dayTotals[budget.id] = new Array(totalDays).fill(0)

    for (const transaction of transactionsListExpense.value) {
      for (const split of Transaction.getSplits(transaction)) {
        const budgetId = split.budget_id
        if (budgetId == null || !(budgetId in dayTotals)) continue
        const dayIndex = Math.min(totalDays - 1, Math.max(0, differenceInCalendarDays(split.date, start)))
        dayTotals[budgetId][dayIndex] += convertCurrency(parseFloat(split.amount) || 0, split.currency_code, Currency.getCode(dashboardCurrency.value))
      }
    }

    const series = topBudgets.map((budget, index) => {
      const limit = limitById[budget.id]
      let cumulative = 0
      const values = dayTotals[budget.id].map((dayAmount) => {
        cumulative += dayAmount
        return limit > 0 ? (cumulative / limit) * 100 : null
      })
      return { id: budget.id, colorVar: seriesColor(index), values }
    })

    if (otherBudgets.length > 0) {
      const otherLimit = otherBudgets.reduce((sum, b) => sum + (limitById[b.id] ?? 0), 0)
      let cumulative = 0
      const values = new Array(totalDays).fill(0).map((_, day) => {
        cumulative += otherBudgets.reduce((sum, b) => sum + (dayTotals[b.id]?.[day] ?? 0), 0)
        return otherLimit > 0 ? (cumulative / otherLimit) * 100 : null
      })
      series.push({ id: 'other', colorVar: seriesColor('other'), values })
    }

    return { totalDays, daysInMonth, series, isEligible: true, periodStart: start }
  })

  // Month-in-progress projection — the Home-native replacement for analytics-behavior-projection.vue.
  // Reads transactionsListExpense (already fetched/filtered by fetchDashboard()), so this too needs
  // no fetch of its own. Tukey/IQR outlier isolation matches the ported original: anything above
  // Q3 + 1.5*IQR is a one-off (e.g. rent on day 1), added flat rather than rate-multiplied into the
  // projection. regularDailyRate explicitly excludes one-offs — rate * days !== spent so far is
  // expected, not a bug (label it as such in the UI).
  const monthProjection = computed(() => {
    const start = dashboardDateStart.value
    const cursor = dashboardPeriodCursor.value
    if (!start || !cursor || !dashboardDateEnd.value) return { isLoaded: false, periodStart: null, daysElapsed: 0, daysInMonth: 0, spentSoFar: 0, regularDailyRate: 0, oneOffTotal: 0, projectedTotal: 0 }

    const daysElapsed = Math.max(1, differenceInCalendarDays(cursor, start) + 1)
    const daysInMonth = differenceInCalendarDays(dashboardDateEnd.value, start) + 1

    const amounts = []
    for (const transaction of transactionsListExpense.value) {
      for (const split of Transaction.getSplits(transaction)) {
        amounts.push(convertCurrency(parseFloat(split.amount) || 0, split.currency_code, Currency.getCode(dashboardCurrency.value)))
      }
    }

    const q = quartiles(amounts)
    const threshold = q ? q.q3 + 1.5 * q.iqr : Infinity
    const oneOffTotal = amounts.filter((amount) => amount > threshold).reduce((sum, amount) => sum + amount, 0)
    const regularTotal = amounts.filter((amount) => amount <= threshold).reduce((sum, amount) => sum + amount, 0)
    const regularDailyRate = regularTotal / daysElapsed

    return {
      isLoaded: true,
      periodStart: start,
      daysElapsed,
      daysInMonth,
      spentSoFar: regularTotal + oneOffTotal,
      regularDailyRate,
      oneOffTotal,
      projectedTotal: regularDailyRate * daysInMonth + oneOffTotal,
    }
  })

  const historicalMonthlyAverageExpense = computed(() => {
    const validTotals = historicalMonthlyExpenseTotals.value.filter((total) => total != null)
    if (validTotals.length === 0) return null
    return validTotals.reduce((sum, total) => sum + total, 0) / validTotals.length
  })

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
    widgetsNetAmountMode,
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
    budgetPace,
    monthProjection,
    historicalMonthlyExpenseTotals,
    historicalMonthlyAverageExpense,
    isLoadingHistoricalMonthlyExpenseTotals,
    fetchHistoricalMonthlyExpenseTotals,
  }
})
