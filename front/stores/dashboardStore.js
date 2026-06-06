import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { startOfMonth, subMonths, getDate, differenceInDays, setDate, addMonths, subDays } from 'date-fns'
import { useProfileStore } from '~/stores/profileStore'
import { useAppStore } from '~/stores/appStore'
import { useAccountStore } from '~/stores/accountStore'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useTemplateStore } from '~/stores/templateStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { useTransactionStore } from '~/stores/transactionStore'
import { keyBy, head } from 'lodash-es'
import AccountRepository from '~/repository/AccountRepository'
import AccountTransformer from '~/transformers/AccountTransformer'
import Account from '~/models/Account'
import DateUtils from '~/utils/DateUtils.js'

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


  // Getters
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


  // Actions
  async function init() {
    const profileStore = useProfileStore()
    let now = new Date()
    let dashboardMonth = startOfMonth(new Date())
    let monthToSub = getDate(now) < profileStore.dashboard.firstDayOfMonth ? 1 : 0
    month.value = subMonths(dashboardMonth, monthToSub)
  }

  async function fetchDashboardTransactionsForInterval() {
    const transactionStore = useTransactionStore()
    transactionsList.value = await transactionStore.fetchDashboardTransactionsForInterval(
      dashboardDateStart.value,
      dashboardDateEnd.value,
      backendFilters.value
    )
  }

  async function fetchDashboardTransactionsForWeek() {
    const transactionStore = useTransactionStore()
    transactionsListLastWeek.value = await transactionStore.fetchDashboardTransactionsForWeek(backendFilters.value)
  }

  async function fetchTransactionsWithTodos() {
    const transactionStore = useTransactionStore()
    const tagStore = useTagStore()
    transactionsWithTodo.value = await transactionStore.fetchTransactionsWithTodos(tagStore.tagTodo)
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
    
    await fetchDashboardTransactionsForInterval()
    await fetchDashboardTransactionsForWeek()
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
    fetchDashboardTransactionsForInterval,
    fetchDashboardTransactionsForWeek,
    fetchTransactionsWithTodos,
    fetchDashboardAccounts,
    fetchDashboard,

  }
})
