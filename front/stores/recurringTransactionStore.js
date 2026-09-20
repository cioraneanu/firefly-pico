import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useIdbStorage } from '~/utils/IdbStorage.js'
import RecurringTransactionRepository from '~/repository/RecurringTransactionRepository.js'
import RecurringTransactionTransformer from '~/transformers/RecurringTransactionTransformer.js'
import { useProfileStore } from '~/stores/profileStore'

export const useRecurringTransactionStore = defineStore('recurringTransaction', () => {
  const recurringTransactionList = useIdbStorage('recurringTransactionList', [])
  const isLoadingRecurringTransactions = ref(false)

  const recurringTransactionDictionary = computed(() => {
    return keyBy(recurringTransactionList.value, 'id')
  })

  function applyRecurringTransactionList(list) {
    recurringTransactionList.value = RecurringTransactionTransformer.transformFromApiList(list)
  }

  async function fetchRecurringTransactions() {
    const profileStore = useProfileStore()
    if (!profileStore.recurringTransactionsEnabled) {
      recurringTransactionList.value = []
      return
    }
    isLoadingRecurringTransactions.value = true

    const list = await new RecurringTransactionRepository().getAllWithMerge()
    applyRecurringTransactionList(list)

    isLoadingRecurringTransactions.value = false
  }

  return {
    recurringTransactionList,
    isLoadingRecurringTransactions,
    recurringTransactionDictionary,
    applyRecurringTransactionList,
    fetchRecurringTransactions,
  }
})
