import { cloneDeep, get, isArray } from 'lodash'
import Transaction from '~/models/Transaction.js'
import Tag from '~/models/Tag.js'
import Category from '~/models/Category.js'
import Budget from '~/models/Budget.js'
import Account from '~/models/Account.js'
import { useProfileStore } from '~/stores/profileStore.js'
import { translate } from '~/plugins/plugin-i18n.js'

const route = useRoute()

export const getActiveFilters = (filterDefinition, filterBag) => {
  return filterDefinition
    .map((item) => {
      let bagKeyValue = get(filterBag, item.bagKey)
      if (!bagKeyValue) {
        return null
      }

      return {
        filter: encodeURIComponent(item.filter(bagKeyValue)),
        display: item.display(bagKeyValue),
        toUrl: item.toUrl?.(bagKeyValue) ?? `${item.bagKey}=${bagKeyValue}`,
      }
    })
    .filter((item) => !!item)
}

export const getFiltersFromURL = (filterDefinition) => {
  let dataStore = useDataStore()
  const route = useRoute()
  console.log('routerFullPath', cloneDeep(route.fullPath))


  return filterDefinition.reduce((result, item) => {
    let urlValue = item.fromUrl?.() ?? route.query?.[item.bagKey]
    console.log('debug', {urlValue, item, route})
    if (!urlValue) {
      return result
    }

    result[item.bagKey] = urlValue
    return result
  }, {})
}

export const saveToUrl = (activeFilters) => {
  const route = useRoute()
  const router = useRouter()

  let queryParams = activeFilters
    .map((item) => item.toUrl)
    .filter((item) => !!item)
    .join('&')

  // Parse string into an object({type: "expense"}) since that is what VueRouter expects.
  const newQueryParams = Object.fromEntries(new URLSearchParams(queryParams))

  // Merge with existing query params and update the route
  router.replace({ query: { ...newQueryParams } })
}

export const filterBagHasValues = (filterBag) => {
  return Object.values(filterBag).some((item) => !!item)
}
