import { ref, computed } from 'vue'
import { getFiltersFromURL, getActiveFilters } from '~/utils/FilterUtils'
import { analyticsFilterDimensionKeys, analyticsFilterModes } from '~/utils/AnalyticsFilterUtils'
import { useCategoryStore } from '~/stores/categoryStore'
import { useTagStore } from '~/stores/tagStore'
import { useBudgetStore } from '~/stores/budgetStore'
import { useAccountStore } from '~/stores/accountStore'

// Module-level singleton state, mirroring useAnalyticsRange.js's pattern — every component
// calling this composable shares the same filter state without prop-drilling.
const filterState = analyticsFilterDimensionKeys.reduce((state, key) => {
  state[key] = { selected: ref([]), mode: ref(analyticsFilterModes.include) }
  return state
}, {})

// Resolves a dimension's item-by-id dictionary for fromUrl. Kept out of AnalyticsFilterUtils.js —
// importing these stores there would pull in their Repository -> axios chains and break that
// file's testability, same reasoning AnalyticsUtils.js documents for avoiding the Transaction model.
const dictionaryByDimension = {
  category: () => useCategoryStore().categoryDictionary,
  tag: () => useTagStore().tagDictionaryById,
  budget: () => useBudgetStore().budgetDictionary,
  account: () => useAccountStore().accountDictionary,
}

// Params are analytics_-prefixed so they can never collide with the transaction list's own
// category_id/exclude_category_id params — this is how "scoped only to the analytics page" is
// enforced at the URL layer, not just the store layer. Mode is omitted from the URL when 'include'
// (the default), so a plain inclusion filter keeps the URL short. Mirrors useAnalyticsRange.js's
// own inline rangeFilterDefinitions rather than living in a shared utils file, since fromUrl needs
// useRoute() + store dictionaries — both Vue-context-dependent already.
function urlDefinitions() {
  return analyticsFilterDimensionKeys.flatMap((dimensionKey) => {
    const idsParam = `analytics_${dimensionKey}_ids`
    const modeParam = `analytics_${dimensionKey}_mode`

    return [
      {
        bagKey: `${dimensionKey}Selected`,
        filter: () => null, // backend query building goes through AnalyticsFilterUtils, not this
        display: (items) => `${dimensionKey}: ${items.length}`,
        toUrl: (items) => `${idsParam}=${items.map((item) => item.id).join(',')}`,
        fromUrl: () => {
          const raw = useRoute().query?.[idsParam]
          if (!raw) return null
          const dictionary = dictionaryByDimension[dimensionKey]()
          return raw
            .split(',')
            .map((id) => dictionary[id])
            .filter(Boolean)
        },
      },
      {
        bagKey: `${dimensionKey}Mode`,
        filter: () => null,
        display: (mode) => `${dimensionKey} mode: ${mode}`,
        toUrl: (mode) => `${modeParam}=${mode}`,
        fromUrl: () => {
          const mode = useRoute().query?.[modeParam]
          return mode === analyticsFilterModes.exclude ? analyticsFilterModes.exclude : null
        },
      },
    ]
  })
}

// useRoute() needs an active component/Nuxt context — hydrate lazily on first call, same
// reasoning as useAnalyticsRange.js.
let hasHydratedFromUrl = false

export const useAnalyticsFilters = () => {
  if (!hasHydratedFromUrl) {
    hasHydratedFromUrl = true
    const initial = getFiltersFromURL(urlDefinitions())
    for (const key of analyticsFilterDimensionKeys) {
      if (initial[`${key}Selected`]) filterState[key].selected.value = initial[`${key}Selected`]
      if (initial[`${key}Mode`]) filterState[key].mode.value = initial[`${key}Mode`]
    }
  }

  const activeFiltersCount = computed(() => analyticsFilterDimensionKeys.reduce((count, key) => count + (filterState[key].selected.value.length > 0 ? 1 : 0), 0))

  function resetFilters() {
    for (const key of analyticsFilterDimensionKeys) {
      filterState[key].selected.value = []
      filterState[key].mode.value = analyticsFilterModes.include
    }
  }

  function toggleMode(dimensionKey) {
    const state = filterState[dimensionKey]
    state.mode.value = state.mode.value === analyticsFilterModes.exclude ? analyticsFilterModes.include : analyticsFilterModes.exclude
  }

  // Plain (non-reactive) snapshot for analyticsStore's query building / factFilterHash.
  function snapshot() {
    return analyticsFilterDimensionKeys.reduce((state, key) => {
      state[key] = { selected: filterState[key].selected.value, mode: filterState[key].mode.value }
      return state
    }, {})
  }

  // NOT a saveToUrl caller itself — FilterUtils.saveToUrl fully replaces the URL's query object
  // rather than merging, so a second independent writer on the analytics page would race
  // useAnalyticsRange.js's own range writer. useAnalyticsRange.js is the single writer; it calls
  // this to fold filter state into its own saveToUrl call. See ANALYTICS_PLAN.md Part 3.
  function activeUrlFilters() {
    const bag = {}
    for (const key of analyticsFilterDimensionKeys) {
      bag[`${key}Selected`] = filterState[key].selected.value.length ? filterState[key].selected.value : null
      bag[`${key}Mode`] = filterState[key].mode.value === analyticsFilterModes.exclude ? analyticsFilterModes.exclude : null
    }
    return getActiveFilters(urlDefinitions(), bag)
  }

  return {
    filterState,
    activeFiltersCount,
    resetFilters,
    toggleMode,
    snapshot,
    activeUrlFilters,
  }
}
