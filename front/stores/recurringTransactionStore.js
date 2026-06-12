import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import RecurringTransactionRepository from '~/repository/RecurringTransactionRepository.js'
import RecurringTransactionTransformer from '~/transformers/RecurringTransactionTransformer.js'

export const useRecurringTransactionStore = defineStore('recurringTransaction', () => {
  const recurringTransactionList = useLocalStorage('recurringTransactionList', [])
  const isLoadingRecurringTransactions = ref(false)

  const recurringTransactionDictionary = computed(() => {
    return keyBy(recurringTransactionList.value, 'id')
  })

  async function fetchRecurringTransactions() {
    isLoadingRecurringTransactions.value = true

    const list = await new RecurringTransactionRepository().getAllWithMerge()
    recurringTransactionList.value = RecurringTransactionTransformer.transformFromApiList(list)

    isLoadingRecurringTransactions.value = false
  }

  return {
    recurringTransactionList,
    isLoadingRecurringTransactions,
    recurringTransactionDictionary,
    fetchRecurringTransactions,
  }
})
