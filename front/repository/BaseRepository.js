import axios from 'axios'
import { get } from 'lodash-es'
import { mapWithConcurrency } from '~/utils/ConcurrencyUtils'

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

  async getAllWithMerge({ filters = [], getAll = null } = {}) {
    let list = []
    let getMethod = (getAll ?? this.getAll)
    const firstPageResponseBody = await getMethod({ filters, page: 1 })
    let responseList = get(firstPageResponseBody, 'data', [])
    list = [...list, ...responseList]

    let totalPages = get(firstPageResponseBody, 'meta.pagination.total_pages')
    for (let page = 2; page <= totalPages; page++) {
      const pageResponse = await getMethod({ filters, page })
      let responseList = get(pageResponse, 'data', [])
      list = [...list, ...responseList]
    }
    return list
  }

  async getAllPages({
    filters = [],
    getAll = null,
    pageSize = 50,
    concurrency = 4,
    showLoading = true,
    timeout = undefined,
    maxPages = 500,
    onSettled = null,
  } = {}) {
    const getMethod = getAll ?? this.getAll

    // Page 1 is fetched alone — it's the only page whose meta we can trust to LEARN
    // total_pages/per_page from. Everything else fans out below.
    let firstPageBody = null
    let firstPageError = null
    try {
      firstPageBody = await getMethod({ filters, page: 1, pageSize, showLoading, timeout })
    } catch (e) {
      firstPageError = e ?? new Error('getAllPages: page 1 request threw a falsy value')
    }

    const declaredPerPage = firstPageError ? pageSize : get(firstPageBody, 'meta.pagination.per_page', pageSize) || pageSize
    const rawTotalPages = firstPageError ? 1 : get(firstPageBody, 'meta.pagination.total_pages', 1) || 1
    const declared = Math.min(Math.max(1, rawTotalPages), maxPages)
    const overflowPage = rawTotalPages > maxPages ? maxPages + 1 : null

    const pageResults = new Map()
    pageResults.set(1, firstPageError ? { data: [], error: firstPageError } : { data: get(firstPageBody, 'data', []), error: null })

    // Fan out pages 2..declared concurrently. Deliberately does NOT wait to see if page 1 was
    // short before fanning out (that's the sequential backend's trick) — reconciliation happens
    // at reassembly time below instead.
    if (!firstPageError && declared > 1) {
      const pageNumbers = Array.from({ length: declared - 1 }, (_, i) => i + 2)
      const settled = await mapWithConcurrency(
        pageNumbers,
        async (page) => {
          const body = await getMethod({ filters, page, pageSize, showLoading, timeout })
          return get(body, 'data', [])
        },
        {
          concurrency,
          onSettled: onSettled ? ({ item: page, value, error }) => onSettled({ page, data: value ?? [], error }) : undefined,
        },
      )
      for (const { item: page, value, error } of settled) {
        pageResults.set(page, { data: error ? [] : value ?? [], error: error ?? null })
      }
    }

    // Reassemble in page order. Stop APPENDING at the first anomaly (error OR short/empty page —
    // the latter is Firefly's normal EOF signal, not a failure) but keep scanning to collect
    // further failedPages, since those requests already happened regardless of concurrency.
    let data = []
    let truncated = false
    const failedPages = []
    for (let page = 1; page <= declared; page++) {
      const result = pageResults.get(page)
      if (!result || result.error) {
        failedPages.push(page)
        truncated = true
        continue
      }
      if (!truncated) {
        data = data.concat(result.data)
        if (result.data.length < declaredPerPage) truncated = true // normal EOF
      }
    }
    if (overflowPage) failedPages.push(overflowPage)

    return { data, isComplete: failedPages.length === 0, failedPages, totalPages: declared, perPage: declaredPerPage }
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