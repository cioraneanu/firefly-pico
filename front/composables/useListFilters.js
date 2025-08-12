import { ref } from 'vue'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getActiveFilters } from '~/utils/FilterUtils.js'

export function useListFilters(config) {

  let { filterDefinitions } = config

  let filters = ref({})

  let activeFilters = computed(() => {
    return getActiveFilters(filterDefinitions, filters.value)
  })

  let activeFiltersCount = computed(() => {
    return activeFilters.value.length
  })

  let filtersDisplayList = computed(() => {
    return activeFilters.value.map((item) => item.display)
  })

  let filtersBackendList = computed(() => {
    return activeFilters.value.map((item) => item.filter)
  })

  return {
    filters, activeFilters, filtersDisplayList, filtersBackendList, activeFiltersCount
  }

}
