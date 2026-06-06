import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { startOfMonth, subMonths, getDate, differenceInDays, setDate, addMonths, subDays, startOfDay } from 'date-fns'
import { useProfileStore } from '~/stores/profileStore'
import { useAppStore } from '~/stores/appStore'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useTemplateStore } from '~/stores/templateStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { keyBy, head } from 'lodash-es'
import AccountRepository from '~/repository/AccountRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import Tag from '~/models/Tag.js'
import DateUtils from '~/utils/DateUtils.js'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils.js'

export const useDashboardStore = defineStore('dashboard', () => {
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

    let filtersParts = [
      `date_after:${DateUtils.dateToString(dashboardDateStart.value)}`,
      `date_before:${DateUtils.dateToString(dashboardDateEnd.value)}`,
      ...getExcludedTransactionFilters()
    ]
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

    let filtersParts = [
      `date_after:${startDate}`,
      `date_before:${endDate}`,
      `type:withdrawal`,
      ...getExcludedTransactionFilters()
    ]
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
    const accountStore = useAccountStore()
    const currencyStore = useCurrencyStore()
    const budgetStore = useBudgetStore()

    // TODO: This is weird...
    let dashboardCurrency = await fetchDashboardAccounts()
    if (dashboardCurrency) {
      currencyStore.dashboardCurrency = dashboardCurrency
    }
    
    await fetchTransactionsForInterval()
    await fetchTransactionsForWeek()
    await fetchTransactionsWithTodos()
    currencyStore.fetchExchangeRate()
    budgetStore.fetchBudgets()
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

    if (!currencyStore.dashboardCurrency?.id) {
      let currencies = list.map((item) => item?.attributes?.currency).filter((item) => !!item)
      return head(currencies)
    }
    return null
  }



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
  }
})
