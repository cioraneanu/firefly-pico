import { defineStore } from 'pinia'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import TransactionTemplateRepository from '~/repository/TransactionTemplateRepository'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'

export const useTemplateStore = defineStore('template', {
  state: () => ({
    transactionTemplateList: useLocalStorage('transactionTemplateList', []),
    isLoadingTransactionTemplates: false,
  }),

  getters: {
    transactionTemplateDictionary: (state) => keyBy(state.transactionTemplateList, 'id'),
  },

  actions: {
    async fetchTransactionTemplates() {
      this.isLoadingTransactionTemplates = true
      const list = await new TransactionTemplateRepository().getAllWithMerge()
      this.transactionTemplateList = TransactionTemplateTransformer.transformFromApiList(list)
      this.isLoadingTransactionTemplates = false
    },
  },
})
