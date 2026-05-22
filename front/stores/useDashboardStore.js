import { defineStore } from 'pinia'
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

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    isLoading: false,
    backendFilters: [],
    month: null,
    transactionsList: [],
    transactionsListLastWeek: [],
    transactionsWithTodo: [],
    tagsWidgetModeOnlyRootTag: useLocalStorage('tagsWidgetModeOnlyRootTag', true),
    lastSync: useLocalStorage('lastSync', null, {
      serializer: {
        read: (v) => (v ? new Date(v) : null),
        write: (v) => (v ? v.toISOString() : null),
      },
    }),
    isSyncRequiredByMissingExtras: false,
  }),

  getters: {
    dashboardDateStart(state) {
      const profileStore = useProfileStore()
      if (!state.month) return null
      return setDate(state.month, profileStore.dashboard.firstDayOfMonth)
    },

    dashboardDateEnd() {
      if (!this.month) return null
      return subDays(addMonths(this.dashboardDateStart, 1), 1)
    },

    isLoadingExtras() {
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
    },
  },

  actions: {
    async init() {
      const profileStore = useProfileStore()
      let now = new Date()
      let dashboardMonth = startOfMonth(new Date())
      let monthToSub = getDate(now) < profileStore.dashboard.firstDayOfMonth ? 1 : 0
      this.month = subMonths(dashboardMonth, monthToSub)
    },

    async fetchDashboardTransactionsForInterval() {
      const transactionStore = useTransactionStore()
      this.transactionsList = await transactionStore.fetchDashboardTransactionsForInterval(
        this.dashboardDateStart,
        this.dashboardDateEnd,
        this.backendFilters
      )
    },

    async fetchDashboardTransactionsForWeek() {
      const transactionStore = useTransactionStore()
      this.transactionsListLastWeek = await transactionStore.fetchDashboardTransactionsForWeek(this.backendFilters)
    },

    async fetchTransactionsWithTodos() {
      const transactionStore = useTransactionStore()
      const tagStore = useTagStore()
      this.transactionsWithTodo = await transactionStore.fetchTransactionsWithTodos(tagStore.tagTodo)
    },

    async fetchDashboard() {
      const accountStore = useAccountStore()
      const currencyStore = useCurrencyStore()
      const budgetStore = useBudgetStore()

      let dashboardCurrency = await accountStore.fetchAccounts(currencyStore.dashboardCurrency)
      if (dashboardCurrency) {
        currencyStore.dashboardCurrency = dashboardCurrency
      }
      
      this.fetchDashboardTransactionsForInterval()
      this.fetchDashboardTransactionsForWeek()
      this.fetchTransactionsWithTodos()
      currencyStore.fetchExchangeRate()
      budgetStore.fetchBudgets()
    },

    async syncEverythingIfOld() {
      let lastSyncTime = this.lastSync ?? subDays(new Date(), 365)
      let now = new Date()
      const appStore = useAppStore()

      if (differenceInDays(now, lastSyncTime) < appStore.daysBetweenFullSync) {
        return
      }

      this.isLoading = true
      await this.syncEverything()
      this.isLoading = false
    },

    async syncEverything() {
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

      this.lastSync = new Date()
    },
  },
})
