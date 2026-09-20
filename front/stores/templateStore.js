import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useIdbStorage } from '~/utils/IdbStorage.js'
import TransactionTemplateRepository from '~/repository/TransactionTemplateRepository'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'

export const useTemplateStore = defineStore('template', () => {
  const transactionTemplateList = useIdbStorage('transactionTemplateList', [])
  const isLoadingTransactionTemplates = ref(false)

  const transactionTemplateDictionary = computed(() => {
    return keyBy(transactionTemplateList.value, 'id')
  })

  function applyTransactionTemplateList(list) {
    transactionTemplateList.value = TransactionTemplateTransformer.transformFromApiList(list)
  }

  async function fetchTransactionTemplates() {
    isLoadingTransactionTemplates.value = true
    const list = await new TransactionTemplateRepository().getAllWithMerge()
    applyTransactionTemplateList(list)
    isLoadingTransactionTemplates.value = false
  }

  return {
    transactionTemplateList,
    isLoadingTransactionTemplates,
    transactionTemplateDictionary,
    applyTransactionTemplateList,
    fetchTransactionTemplates,
  }
})
