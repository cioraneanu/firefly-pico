import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import BudgetRepository from '~/repository/BudgetRepository.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetLimitTransformer from '~/transformers/BudgetLimitTransformer.js'

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
    isLoadingBudgets.value = true

    const asyncBudget = new BudgetRepository().getAllWithMerge()
    let fetchBudgetLimits = new BudgetRepository().getBudgetLimits
    const asyncBudgetLimit = new BudgetRepository().getAllWithMerge({ getAll: fetchBudgetLimits })

    const [fetchedBudgetList, fetchedBudgetLimitList] = await Promise.all([asyncBudget, asyncBudgetLimit])

    budgetList.value = BudgetTransformer.transformFromApiList(fetchedBudgetList)
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
  }
})
