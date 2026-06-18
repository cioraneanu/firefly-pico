import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import BudgetRepository from '~/repository/BudgetRepository.js'
import BudgetLimitRepository from '~/repository/BudgetLimitRepository.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetLimitTransformer from '~/transformers/BudgetLimitTransformer.js'
import DateUtils from '~/utils/DateUtils.js'
import { useDashboardStore } from '~/stores/dashboardStore'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useProfileStore } from '~/stores/profileStore'

export const useBudgetStore = defineStore('budget', () => {
  const budgetList = useLocalStorage('budgetList', [])
  const budgetLimitList = useLocalStorage('budgetLimitList', [])
  const isLoadingBudgets = ref(false)

  const budgetDictionary = computed(() => {
    return keyBy(budgetList.value, 'id')
  })

  const budgetLimitDictionary = computed(() => {
    return keyBy(budgetLimitList.value, 'attributes.budget_id')
  })



  async function fetchBudgets() {
    const profileStore = useProfileStore()
    if (!profileStore.budgetsEnabled) {
      budgetList.value = []
      budgetLimitList.value = []
      return
    }

    isLoadingBudgets.value = true

    const dashboardStore = useDashboardStore()
    
    // Fallback to current month if dashboard store is not initialized
    let start = dashboardStore.dashboardDateStart ?? startOfMonth(new Date())
    let end = dashboardStore.dashboardDateEnd ?? endOfMonth(new Date())

    const filters = [
      { field: 'start', value: DateUtils.dateToString(start) },
      { field: 'end', value: DateUtils.dateToString(end) },
    ]

    const asyncBudget = new BudgetRepository().getAllWithMerge()
    const asyncBudgetLimit = new BudgetLimitRepository().getAllWithMerge({ filters })

    const [fetchedBudgetList, fetchedBudgetLimitList] = await Promise.all([asyncBudget, asyncBudgetLimit])

    budgetList.value = BudgetTransformer.transformFromApiList(fetchedBudgetList)
    budgetLimitList.value = BudgetLimitTransformer.transformFromApiList(fetchedBudgetLimitList)

    isLoadingBudgets.value = false
  }

  async function fetchBudgetLimits() {
    const profileStore = useProfileStore()
    if (!profileStore.budgetsEnabled) {
      budgetLimitList.value = []
      return
    }

    isLoadingBudgets.value = true

    const dashboardStore = useDashboardStore()

    // Fallback to current month if dashboard store is not initialized
    let start = dashboardStore.dashboardDateStart ?? startOfMonth(new Date())
    let end = dashboardStore.dashboardDateEnd ?? endOfMonth(new Date())

    const filters = [
      { field: 'start', value: DateUtils.dateToString(start) },
      { field: 'end', value: DateUtils.dateToString(end) },
    ]

    const fetchedBudgetLimitList = await new BudgetLimitRepository().getAllWithMerge({ filters })
    budgetLimitList.value = BudgetLimitTransformer.transformFromApiList(fetchedBudgetLimitList)

    isLoadingBudgets.value = false
  }

  return {
    budgetList,
    budgetLimitList,
    isLoadingBudgets,
    budgetDictionary,
    budgetLimitDictionary,
    fetchBudgets,
    fetchBudgetLimits,
  }
})
