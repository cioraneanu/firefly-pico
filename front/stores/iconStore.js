import { defineStore } from 'pinia'
import { get } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import CustomIconRepository from '~/repository/CustomIconRepository'
import Icon from '~/models/Icon'

export const useIconStore = defineStore('icon', () => {
  const customIconList = useLocalStorage('customIconList', [])

  async function fetchCustomIcons() {
    const response = await new CustomIconRepository().getAll({ showLoading: false })
    const files = get(response, 'data')
    // A failed request (e.g. offline) keeps the cached list
    if (Array.isArray(files)) {
      customIconList.value = files.map((file) => Icon.getIcon(Icon.getCustomIcon(file)))
    }
  }

  return {
    customIconList,
    fetchCustomIcons,
  }
})
