import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import CustomIconRepository from '~/repository/CustomIconRepository'
import Icon from '~/models/Icon'

export const useIconStore = defineStore('icon', () => {
  const customIconList = useLocalStorage('customIconList', [])
  const isLoadingCustomIcons = ref(false)

  async function fetchCustomIcons() {
    isLoadingCustomIcons.value = true
    const response = await new CustomIconRepository().getAll({ showLoading: false })
    customIconList.value = get(response, 'data', []).map((file) => Icon.getIcon(Icon.getCustomIcon(file)))
    isLoadingCustomIcons.value = false
  }

  return {
    customIconList,
    isLoadingCustomIcons,
    fetchCustomIcons,
  }
})
