import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import TransactionTemplateRepository from '~/repository/TransactionTemplateRepository'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'

export const useTemplateStore = defineStore('template', () => {
  const transactionTemplateList = useLocalStorage('transactionTemplateList', [])
  const isLoadingTransactionTemplates = ref(false)

  const transactionTemplateDictionary = computed(() => {
    return keyBy(transactionTemplateList.value, 'id')
  })

  async function fetchTransactionTemplates() {
    isLoadingTransactionTemplates.value = true
    const list = await new TransactionTemplateRepository().getAllWithMerge()
    transactionTemplateList.value = TransactionTemplateTransformer.transformFromApiList(list)
    isLoadingTransactionTemplates.value = false
  }

  return {
    transactionTemplateList,
    isLoadingTransactionTemplates,
    transactionTemplateDictionary,
    fetchTransactionTemplates,
  }
})
