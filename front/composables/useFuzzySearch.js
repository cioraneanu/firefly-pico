import Fuse from 'fuse.js'
import { watch } from 'vue'
import { get, head } from 'lodash'


export const useFuzzySearchResource = {
  template: {
    weight: 1.0,
    type: 'template',
  },
  tag: {
    weight: 1.5,
    type: 'tag',
  },
  category: {
    weight: 1.5,
    type: 'category',
  },
}

export function useFuzzySearch(props) {
  const dataStore = useDataStore()

  const fuseOptions = { ignoreLocation: true, includeScore: true, minMatchCharLength: 3, threshold: 0.6, distance: 100, includeMatches: true }

  const fuseTags = new Fuse([], { ...fuseOptions, keys: ['attributes.tag'] })
  const fuseTransactionTemplate = new Fuse([], { ...fuseOptions, keys: ['name', 'extra_names.value'] })
  const fuseCategories = new Fuse([], { ...fuseOptions, keys: ['attributes.name'] })

  watch(
    dataStore.tagList,
    (newValue) => {
      fuseTags.setCollection(newValue)
    },
    { immediate: true },
  )

  watch(
    dataStore.transactionTemplateList,
    (newValue) => {
      fuseTransactionTemplate.setCollection(newValue)
    },
    { immediate: true },
  )

  watch(
    dataStore.categoryList,
    (newValue) => {
      fuseCategories.setCollection(newValue)
    },
    { immediate: true },
  )

  // ---

  const search = (text) => {
    const sanitizedText = LanguageUtils.removeAccents(text).trim().split(' ').join(' | ')

    const fuseTemplateResults = fuseTransactionTemplate.search(sanitizedText)
    const fuseTagResults = fuseTags.search(sanitizedText)
    const fuseCategoryResults = fuseCategories.search(sanitizedText)

    let assistantGuesses = [
      {
        score: get(head(fuseTemplateResults), 'score') * useFuzzySearchResource.template.weight,
        type: useFuzzySearchResource.template.type,
        item: get(head(fuseTemplateResults), 'item'),
        match: get(head(fuseTemplateResults), 'matches.0.value'),
      },
      {
        score: get(head(fuseTagResults), 'score') * useFuzzySearchResource.tag.weight,
        type: useFuzzySearchResource.tag.type,
        item: get(head(fuseTagResults), 'item'),
      },
      {
        score: get(head(fuseCategoryResults), 'score') * useFuzzySearchResource.category.weight,
        type: useFuzzySearchResource.category.type,
        item: get(head(fuseCategoryResults), 'item'),
      },
    ]
      .filter((result) => !!result.item)
      .sort((a, b) => {
        return a.score - b.score
      })
    return head(assistantGuesses)
  }

  return { search }
}
