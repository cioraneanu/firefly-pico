import axios from 'axios'
import { get, range } from 'lodash-es'

// Used when we want a whole collection rather than a screenful of it.
export const FULL_FETCH_PAGE_SIZE = 1000

// Guard against a bogus total_pages fanning out into hundreds of requests.
const MAX_PAGES = 50

// How many leftover pages to fetch at once when one page was not enough.
const PARALLEL_PAGES = 5

export default class BaseRepository {
  constructor(endpoint) {
    this.endpoint = endpoint
    this.getAll = this.getAll.bind(this)
  }

  getUrl() {
    const appStore = useAppStore()
    return `${appStore.picoBackendURL}/${this.endpoint}`
  }

  async getOne(id) {
    let result = await axios.get(`${this.getUrl()}/${id}`)
    return get(result, 'data', {})
  }

  async getAll({ filters = [], page = 1, pageSize = 50, showLoading = true } = {}) {
    let url = this.getUrlForRequest({ filters, page, pageSize })
    let response = await axios.get(url, { showLoading })
    return get(response, 'data', {})
  }

  async getTable({ filters = [], page = 1 } = {}) {
    let url = this.getUrlForRequest({ filters, page })
    let response = await axios.get(url)
    return get(response, 'data', {})
  }

  async getAllWithMerge({ filters = [], pageSize = FULL_FETCH_PAGE_SIZE, getAll = null } = {}) {
    let getMethod = getAll ?? this.getAll
    const firstPageResponseBody = await getMethod({ filters, page: 1, pageSize })
    let list = get(firstPageResponseBody, 'data', [])

    // Firefly III clamps "limit" to 65536, so one page covers the whole collection in practice.
    // A short page is what tells us we are done: the advertised page count cannot be trusted
    // (the search endpoint reports totals for the unfiltered set).
    if (list.length < pageSize) {
      return list
    }

    // A few pages at a time rather than all at once: total_pages may be wildly overstated, and
    // firing dozens of parallel requests at the backend would be worse than the serial loop
    // this replaces.
    let totalPages = Math.min(get(firstPageResponseBody, 'meta.pagination.total_pages') ?? 1, MAX_PAGES)
    for (let page = 2; page <= totalPages; page += PARALLEL_PAGES) {
      const batch = range(page, Math.min(page + PARALLEL_PAGES, totalPages + 1))
      const responses = await Promise.all(batch.map((batchPage) => getMethod({ filters, page: batchPage, pageSize })))
      const batchLists = responses.map((response) => get(response, 'data', []))

      list = batchLists.reduce((carry, batchList) => [...carry, ...batchList], list)
      if (batchLists.some((batchList) => batchList.length < pageSize)) {
        break
      }
    }

    return list
  }

  async update(id, data) {
    let result = await axios.put(`${this.getUrl()}/${id}`, data)
    return result
    // return get(result, 'data', {})
  }

  async insert(data) {
    let result = await axios.post(`${this.getUrl()}`, data)
    return result
    // return get(result, 'data', {})
  }

  async delete(id) {
    let result = await axios.delete(`${this.getUrl()}/${id}`)
    return result
    // return get(result, 'data', {})
  }

  // ---------------------------- PRIVATE --------------------------

  getUrlForRequest({ filters = [], page = 1, pageSize = 10, url = null } = {}) {
    let requestURL = url ?? this.getUrl()

    let filterParam = this.getURLSuffixFromFilters(filters)
    let pageParam = page ? `page=${page}` : null
    let pageSizeParam = pageSize ? `limit=${pageSize}` : null

    let urlParams = [filterParam, pageParam, pageSizeParam].filter((item) => item)
    if (urlParams.length > 0) {
      requestURL += '?' + urlParams.join('&')
    }

    return requestURL
  }

  getURLSuffixFromFilters(filterArray) {
    if (!filterArray || filterArray.length === 0) {
      return null
    }

    let filters = []
    for (const filter of filterArray) {
      let filterValue = Array.isArray(filter.value) ? filter.value.join(',') : filter.value
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        continue
      }
      filterValue = encodeURIComponent(filterValue)
      // filters.push(`filter[${filter.field}]=${filterValue}`)
      filters.push(`${filter.field}=${filterValue}`)
    }

    return `${filters.join('&')}`
  }
}
