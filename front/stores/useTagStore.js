import { defineStore } from 'pinia'
import { keyBy, cloneDeep } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import TagRepository from '~/repository/TagRepository'
import TagTransformer from '~/transformers/TagTransformer'
import { listToTree, setLevel, sortByPath, treeToList } from '~/utils/DataUtils'
import LanguageUtils from '~/utils/LanguageUtils.js'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tagList: useLocalStorage('tagList', []),
    isLoadingTags: false,
  }),

  getters: {
    tagTodo: (state) => state.tagList.find((tag) => tag?.attributes?.is_todo),
    tagDictionaryByName: (state) => keyBy(state.tagList, (item) => LanguageUtils.removeAccentsAndLowerCase(item?.attributes?.tag)),
    tagDictionaryById: (state) => keyBy(state.tagList, 'id'),
    tagListHierarchy: (state) => {
      let sortedList = sortByPath(state.tagList, 'attributes.tag')
      const tree = listToTree(sortedList)
      return treeToList(tree)
    },
  },

  actions: {
    async fetchTags() {
      this.isLoadingTags = true
      const list = await new TagRepository().getAllWithMerge()
      this.tagList = TagTransformer.transformFromApiList(list)

      let newTags = cloneDeep(this.tagList)
      setLevel(newTags)
      this.isLoadingTags = false
    },
  },
})
