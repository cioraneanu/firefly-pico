import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import CategoryRepository from '~/repository/CategoryRepository'
import CategoryTransformer from '~/transformers/CategoryTransformer'
import { useProfileStore } from '~/stores/profileStore'

export const useCategoryStore = defineStore('category', () => {
  const categoryList = useLocalStorage('categoryList', [])
  const isLoadingCategories = ref(false)

  const categoryDictionary = computed(() => {
    return keyBy(categoryList.value, 'id')
  })

  async function fetchCategories() {
    const profileStore = useProfileStore()
    if (!profileStore.categoriesEnabled) {
      categoryList.value = []
      return
    }
    isLoadingCategories.value = true
    const list = await new CategoryRepository().getAllWithMerge()
    categoryList.value = CategoryTransformer.transformFromApiList(list)
    isLoadingCategories.value = false
  }

  return {
    categoryList,
    isLoadingCategories,
    categoryDictionary,
    fetchCategories,
  }
})
