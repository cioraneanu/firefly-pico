import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { startOfMonth, subMonths, getDate, differenceInDays, setDate, addMonths, subDays } from 'date-fns'
import { useProfileStore } from '~/stores/profileStore'
import { useAppStore } from '~/stores/appStore'
import { useAccountStore } from '~/stores/useAccountStore'
import { useCategoryStore } from '~/stores/useCategoryStore'
import { useTagStore } from '~/stores/useTagStore'
import { useTemplateStore } from '~/stores/useTemplateStore'
import { useCurrencyStore } from '~/stores/useCurrencyStore'
import { useBudgetStore } from '~/stores/useBudgetStore'
import { useTransactionStore } from '~/stores/useTransactionStore'
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
  const lastSync = useLocalStorage('lastSync', null, {
    serializer: {
      read: (v) => (v ? new Date(v) : null),
      write: (v) => (v ? v.toISOString() : null),
    },
  })
  const isSyncRequiredByMissingExtras = ref(false)

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

  async function syncEverythingIfOld() {
    let lastSyncTime = lastSync.value ?? subDays(new Date(), 365)
    let now = new Date()
    const appStore = useAppStore()

    if (differenceInDays(now, lastSyncTime) < appStore.daysBetweenFullSync) {
      return
    }

    isLoading.value = true
    await syncEverything()
    isLoading.value = false
  }

  async function syncEverything() {
    const appStore = useAppStore()
    if (!appStore.hasAuthToken) return

    const categoryStore = useCategoryStore()
    const accountStore = useAccountStore()
    const tagStore = useTagStore()
    const templateStore = useTemplateStore()
    const currencyStore = useCurrencyStore()
    const budgetStore = useBudgetStore()
    const profileStore = useProfileStore()

    await Promise.all([
      categoryStore.fetchCategories(),
      accountStore.fetchAccounts(currencyStore.dashboardCurrency),
      tagStore.fetchTags(),
      templateStore.fetchTransactionTemplates(),
      currencyStore.fetchCurrencies(),
      budgetStore.fetchBudgets(),
      currencyStore.fetchExchangeRate(),
      profileStore.getProfiles(),
    ])

    lastSync.value = new Date()
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
    lastSync,
    isSyncRequiredByMissingExtras,
    dashboardAccountDictionary,
    dashboardDateStart,
    dashboardDateEnd,
    init,
    fetchDashboardTransactionsForInterval,
    fetchDashboardTransactionsForWeek,
    fetchTransactionsWithTodos,
    fetchDashboardAccounts,
    fetchDashboard,
    syncEverythingIfOld,
    syncEverything,
  }
})
