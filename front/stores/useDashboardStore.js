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

export const useDashboardStore = defineStore('dashboard', () => {
  const isLoading = ref(false)
  const backendFilters = ref([])
  const month = ref(null)
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
  const dashboardDateStart = computed(() => {
    const profileStore = useProfileStore()
    if (!month.value) return null
    return setDate(month.value, profileStore.dashboard.firstDayOfMonth)
  })

  const dashboardDateEnd = computed(() => {
    if (!month.value) return null
    return subDays(addMonths(dashboardDateStart.value, 1), 1)
  })

  const isLoadingExtras = computed(() => {
    const categoryStore = useCategoryStore()
    const tagStore = useTagStore()
    const templateStore = useTemplateStore()
    const accountStore = useAccountStore()
    const currencyStore = useCurrencyStore()
    const budgetStore = useBudgetStore()

    return (
      categoryStore.isLoadingCategories ||
      tagStore.isLoadingTags ||
      templateStore.isLoadingTransactionTemplates ||
      accountStore.isLoadingAccounts ||
      currencyStore.isLoadingExchangeRates ||
      currencyStore.isLoadingCurrencies ||
      budgetStore.isLoadingBudgets
    )
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

    let dashboardCurrency = await accountStore.fetchAccounts(currencyStore.dashboardCurrency)
    if (dashboardCurrency) {
      currencyStore.dashboardCurrency = dashboardCurrency
    }
    
    await fetchDashboardTransactionsForInterval()
    await fetchDashboardTransactionsForWeek()
    await fetchTransactionsWithTodos()
    currencyStore.fetchExchangeRate()
    budgetStore.fetchBudgets()
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
    transactionsList,
    transactionsListLastWeek,
    transactionsWithTodo,
    tagsWidgetModeOnlyRootTag,
    lastSync,
    isSyncRequiredByMissingExtras,
    dashboardDateStart,
    dashboardDateEnd,
    isLoadingExtras,
    init,
    fetchDashboardTransactionsForInterval,
    fetchDashboardTransactionsForWeek,
    fetchTransactionsWithTodos,
    fetchDashboard,
    syncEverythingIfOld,
    syncEverything,
  }
})
