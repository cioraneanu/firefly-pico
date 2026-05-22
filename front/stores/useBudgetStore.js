import { defineStore } from 'pinia'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import BudgetRepository from '~/repository/BudgetRepository.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetLimitTransformer from '~/transformers/BudgetLimitTransformer.js'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    budgetList: useLocalStorage('budgetList', []),
    budgetLimitList: useLocalStorage('budgetLimitList', []),
    isLoadingBudgets: false,
  }),

  getters: {
    budgetDictionary: (state) => keyBy(state.budgetList, 'id'),
    budgetLimitDictionary: (state) => keyBy(state.budgetLimitList, 'attributes.budget_id'),
  },

  actions: {
    async fetchBudgets() {
      this.isLoadingBudgets = true

      const asyncBudget = new BudgetRepository().getAllWithMerge()
      let fetchBudgetLimits = new BudgetRepository().getBudgetLimits
      const asyncBudgetLimit = new BudgetRepository().getAllWithMerge({ getAll: fetchBudgetLimits })

      const [budgetList, budgetLimitList] = await Promise.all([asyncBudget, asyncBudgetLimit])

      this.budgetList = BudgetTransformer.transformFromApiList(budgetList)
      this.budgetLimitList = BudgetLimitTransformer.transformFromApiList(budgetLimitList)

      this.isLoadingBudgets = false
    },
  },
})
