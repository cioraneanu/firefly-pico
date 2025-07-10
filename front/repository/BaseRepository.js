import axios from 'axios'
import { get } from 'lodash'

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

  async getAll({ filters = [], page = 1, pageSize = 50 } = {}) {
    let url = this.getUrlForRequest({ filters, page, pageSize })
    let response = await axios.get(url)
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