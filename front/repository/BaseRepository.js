import axios from 'axios'
import { get, range } from 'lodash-es'

const FULL_FETCH_PAGE_SIZE = 250
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

  async getAllWithMerge({ filters = [], getAll = null } = {}) {
    const getMethod = getAll ?? this.getAll
    const getPage = async (page) => get(await getMethod({ filters, page, pageSize: FULL_FETCH_PAGE_SIZE }), 'data', [])

    const firstPageResponseBody = await getMethod({ filters, page: 1, pageSize: FULL_FETCH_PAGE_SIZE })
    let list = get(firstPageResponseBody, 'data', [])
    // A short page ends the list: search reports wrong totals, and the server may cap the page size
    const pageSize = Number(get(firstPageResponseBody, 'meta.pagination.per_page')) || FULL_FETCH_PAGE_SIZE
    const totalPages = get(firstPageResponseBody, 'meta.pagination.total_pages') ?? 1
    let isLastPage = list.length < pageSize

    for (let page = 2; page <= totalPages && !isLastPage; page += PARALLEL_PAGES) {
      const pageLists = await Promise.all(range(page, Math.min(page + PARALLEL_PAGES, totalPages + 1)).map(getPage))
      list = [...list, ...pageLists.flat()]
      isLastPage = pageLists.some((pageList) => pageList.length < pageSize)
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
