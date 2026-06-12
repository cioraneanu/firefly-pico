import { watch } from 'vue'
import { get, head } from 'lodash-es'
import MiniSearch from 'minisearch'
import { useTagStore } from '~/stores/tagStore'
import { useTemplateStore } from '~/stores/templateStore'
import { useCategoryStore } from '~/stores/categoryStore'

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

const MIN_SUFFIX_LENGTH = 3

const normalizeTerm = (term) => LanguageUtils.removeAccentsAndLowerCase(term)

// Index every suffix of each word ("doctor" -> "doctor", "octor", "ctor", ...) so that together
// with prefix search a query can match the middle of a word, not just its beginning.
const termToSuffixes = (term) => {
  const normalized = normalizeTerm(term)
  const suffixes = []
  for (let i = 0; i <= normalized.length - MIN_SUFFIX_LENGTH; i++) {
    suffixes.push(normalized.slice(i))
  }
  return suffixes.length > 0 ? suffixes : [normalized]
}

const searchOptions = {
  prefix: true, // a query word may match only the start of an indexed term
  fuzzy: 0.2, // allow fuzzy matching (edit distance 1–2)
  combineWith: 'AND', // require all words to match
  processTerm: normalizeTerm,
}

export function useFuzzySearch() {
  const tagStore = useTagStore()
  const templateStore = useTemplateStore()
  const categoryStore = useCategoryStore()

  const resources = [
    {
      ...useFuzzySearchResource.template,
      getList: () => templateStore.transactionTemplateList,
      getItem: (id) => templateStore.transactionTemplateDictionary[id],
      indexOptions: {
        fields: ['name', 'extra_names'],
        extractField: (document, fieldName) => (fieldName === 'extra_names' ? document.extra_names.map((x) => x.value) : document[fieldName]),
      },
      // Display the template name, or the matched extra name when only that matched
      getMatchName: (result, item) => {
        const matchedName = Object.values(result.match).some((fields) => fields.includes('name'))
        if (matchedName) {
          return item.name
        }
        const matchedTerms = Object.keys(result.match)
        const extraName = (item.extra_names ?? []).find((extraName) => matchedTerms.some((term) => normalizeTerm(extraName.value).includes(term)))
        return extraName?.value ?? item.name
      },
    },
    {
      ...useFuzzySearchResource.tag,
      getList: () => tagStore.tagList,
      getItem: (id) => tagStore.tagDictionaryById[id],
      indexOptions: { fields: ['attributes.tag'], extractField: get },
    },
    {
      ...useFuzzySearchResource.category,
      getList: () => categoryStore.categoryList,
      getItem: (id) => categoryStore.categoryDictionary[id],
      indexOptions: { fields: ['attributes.name'], extractField: get },
    },
  ]

  for (const resource of resources) {
    resource.index = new MiniSearch({ ...resource.indexOptions, processTerm: termToSuffixes })
    watch(
      resource.getList,
      (newValue) => {
        resource.index.removeAll()
        resource.index.addAll(newValue)
      },
      { immediate: true, deep: true },
    )
  }

  const search = (text) => {
    const sanitizedText = LanguageUtils.removeAccents(text).trim()

    const guesses = resources
      .map((resource) => {
        const result = head(resource.index.search(sanitizedText, searchOptions))
        if (!result) {
          return null
        }
        const item = resource.getItem(result.id)
        return {
          score: result.score * resource.weight,
          type: resource.type,
          item: item,
          match: item && resource.getMatchName ? resource.getMatchName(result, item) : null,
        }
      })
      .filter((guess) => guess?.item)
      .sort((a, b) => b.score - a.score)

    return head(guesses)
  }

  return { search }
}
