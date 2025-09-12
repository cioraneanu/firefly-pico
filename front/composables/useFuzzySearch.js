import { watch } from 'vue'
import { get, head } from 'lodash'
import MiniSearch from 'minisearch'

export const useFuzzySearchResource = {
  template: {
    weight: 2.0,
    type: 'template',
  },
  tag: {
    weight: 1.0,
    type: 'tag',
  },
  category: {
    weight: 1.0,
    type: 'category',
  },
}

export function useFuzzySearch(props) {
  const dataStore = useDataStore()

  const fuzzyOptions = {
    prefix: true, // allow prefix search ("sana" matches "sanatate")
    fuzzy: 0.2, // allow fuzzy matching (edit distance 1–2)
    combineWith: 'AND', // require all words to match
  }

  let queryTag = new MiniSearch({
    fields: ['attributes.tag'],
    extractField: (document, fieldName) => get(document, fieldName), // Nested paths
  })

  let queryCategory = new MiniSearch({
    fields: ['attributes.name'],
    extractField: (document, fieldName) => get(document, fieldName), // Nested paths
  })

  let queryTemplate = new MiniSearch({
    fields: ['name', 'extra_names'],
    extractField: (document, fieldName) => {
      if (fieldName === 'extra_names') {
        return document.extra_names.map((x) => x.value)
      }
      return document[fieldName]
    },
  })

  watch(
    dataStore.tagList,
    (newValue) => {
      queryTag.removeAll()
      queryTag.addAll(newValue)
    },
    { immediate: true },
  )

  watch(
    dataStore.transactionTemplateList,
    (newValue) => {
      queryTemplate.removeAll()
      queryTemplate.addAll(newValue)
    },
    { immediate: true },
  )

  watch(
    dataStore.categoryList,
    (newValue) => {
      queryCategory.removeAll()
      queryCategory.addAll(newValue)
    },
    { immediate: true },
  )

  // ---

  const search = (text) => {
    const sanitizedText = LanguageUtils.removeAccents(text).trim()

    let resultsTag = queryTag.search(sanitizedText, fuzzyOptions)
    let resultsCategory = queryCategory.search(sanitizedText, fuzzyOptions)
    let resultsTemplate = queryTemplate.search(sanitizedText, fuzzyOptions)
    // console.log({ resultsTag, resultsCategory, resultsTemplate })

    let [foundTag, foundCategory, foundTemplate] = [resultsTag, resultsCategory, resultsTemplate].map(head)
    // console.log({ foundTag, foundCategory, foundTemplate })

    let assistantGuesses = [
      {
        score: (foundTemplate?.score ?? 0) * useFuzzySearchResource.template.weight,
        type: useFuzzySearchResource.template.type,
        item: dataStore.transactionTemplateDictionary[foundTemplate?.id],
        match: (foundTemplate?.terms ?? []).join(" "),
      },
      {
        score: (foundTag?.score ?? 0) * useFuzzySearchResource.tag.weight,
        type: useFuzzySearchResource.tag.type,
        item: dataStore.tagDictionaryById[foundTag?.id],
      },
      {
        score: (foundCategory?.score ?? 0) * useFuzzySearchResource.category.weight,
        type: useFuzzySearchResource.category.type,
        item: dataStore.categoryDictionary[foundCategory?.id],
      },
    ]
    // console.log({assistantGuesses})


    assistantGuesses = assistantGuesses.filter((result) => !!result.item)
      .sort((a, b) => {
        return b.score - a.score
      })
    return head(assistantGuesses)
  }

  return { search }
}
