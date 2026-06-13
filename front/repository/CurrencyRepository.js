import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash-es'

export default class CurrencyRepository extends BaseRepository {
  constructor() {
    super(`api/currencies`)
  }

  async update(id, data) {
    return await axios.put(`${this.getUrl()}/${data.code}`, data)
  }

  async delete(id) {
    let currencyStore = useCurrencyStore()
    let currencyCode = currencyStore.currencyDictionary[id]?.attributes?.code
    return await axios.delete(`${this.getUrl()}/${currencyCode}`)
  }

  async getCurrencyExchange() {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/currencies/exchange`
    let response = await axios.get(url)
    return get(response, 'data', {})
  }

  // User-defined exchange rates configured in Firefly III itself.
  // These are proxied straight to Firefly's `/api/v1/exchange-rates` endpoint (added in Firefly v6.1).
  // Older Firefly instances return 404 - in that case we simply return an empty list so the app
  // keeps working with the external (USD based) rates only.
  async getUserExchangeRates({ showLoading = false } = {}) {
    const appStore = useAppStore()
    const baseUrl = `${appStore.picoBackendURL}/api/exchange-rates`

    let list = []
    let page = 1
    let totalPages = 1

    do {
      const response = await axios.get(`${baseUrl}?page=${page}&limit=200`, { showLoading, showErrorToast: false })
      if (!ResponseUtils.isSuccess(response)) {
        return []
      }
      list = [...list, ...get(response, 'data.data', [])]
      totalPages = get(response, 'data.meta.pagination.total_pages', 1)
      page++
    } while (page <= totalPages)

    return list
  }
}
