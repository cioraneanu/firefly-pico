import { defineStore } from 'pinia'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import CategoryRepository from '~/repository/CategoryRepository'
import CategoryTransformer from '~/transformers/CategoryTransformer'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categoryList: useLocalStorage('categoryList', []),
    isLoadingCategories: false,
  }),

  getters: {
    categoryDictionary: (state) => keyBy(state.categoryList, 'id'),
  },

  actions: {
    async fetchCategories() {
      this.isLoadingCategories = true
      const list = await new CategoryRepository().getAllWithMerge()
      this.categoryList = CategoryTransformer.transformFromApiList(list)
      this.isLoadingCategories = false
    },
  },
})
