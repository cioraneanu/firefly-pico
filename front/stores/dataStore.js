import { defineStore, storeToRefs } from 'pinia'
import { useAccountStore } from './useAccountStore'
import { useTransactionStore } from './useTransactionStore'
import { useBudgetStore } from './useBudgetStore'
import { useCategoryStore } from './useCategoryStore'
import { useTagStore } from './useTagStore'
import { useCurrencyStore } from './useCurrencyStore'
import { useTemplateStore } from './useTemplateStore'
import { useDashboardStore } from './useDashboardStore'
import { useDashboardStats } from '~/composables/useDashboardStats'

export const useDataStore = defineStore('data', () => {
  const accountStore = useAccountStore()
  const transactionStore = useTransactionStore()
  const budgetStore = useBudgetStore()
  const categoryStore = useCategoryStore()
  const tagStore = useTagStore()
  const currencyStore = useCurrencyStore()
  const templateStore = useTemplateStore()
  const dashboardStore = useDashboardStore()
  const dashboardStats = useDashboardStats()

  return {
    ...storeToRefs(accountStore),
    ...storeToRefs(transactionStore),
    ...storeToRefs(budgetStore),
    ...storeToRefs(categoryStore),
    ...storeToRefs(tagStore),
    ...storeToRefs(currencyStore),
    ...storeToRefs(templateStore),
    ...storeToRefs(dashboardStore),
    
    // Maintain backward compatibility for dataStore.dashboard.*
    dashboard: dashboardStore,
    
    // Spread all computed properties from dashboardStats
    ...dashboardStats,

    // Expose actions
    fetchAccounts: accountStore.fetchAccounts,
    fetchTransactionsWithTodos: transactionStore.fetchTransactionsWithTodos,
    fetchDashboardTransactionsForInterval: dashboardStore.fetchDashboardTransactionsForInterval,
    fetchDashboardTransactionsForWeek: dashboardStore.fetchDashboardTransactionsForWeek,
    fetchBudgets: budgetStore.fetchBudgets,
    fetchCategories: categoryStore.fetchCategories,
    fetchTags: tagStore.fetchTags,
    fetchExchangeRate: currencyStore.fetchExchangeRate,
    fetchCurrencies: currencyStore.fetchCurrencies,
    fetchTransactionTemplates: templateStore.fetchTransactionTemplates,
    
    init: dashboardStore.init,
    fetchDashboard: dashboardStore.fetchDashboard,
    syncEverythingIfOld: dashboardStore.syncEverythingIfOld,
    syncEverything: dashboardStore.syncEverything,
  }
})
