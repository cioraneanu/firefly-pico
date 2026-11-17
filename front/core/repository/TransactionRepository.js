import BaseRepository from '~/core/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash-es'

export default class TransactionRepository extends BaseRepository {
  constructor() {
    super(`api/transactions`)
    this.searchTransaction = this.searchTransaction.bind(this)
  }

  async searchTransaction({ filters = [], page = 1, pageSize = 50, showLoading = true } = {}) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/search/transactions`
    let searchUrl = this.getUrlForRequest({ filters, page, pageSize, url })
    let response = await axios.get(searchUrl, { showLoading })
    return get(response, 'data', {})
  }

  async searchTransactionsTotal({ filters = [] } = {}) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/search/transactions/total`
    let searchUrl = this.getUrlForRequest({ filters, page: null, pageSize: null, url })
    // A failure (422 = more transactions match than the backend sums, or a timeout) is shown next to the total, not as an error toast
    return await axios.get(searchUrl, { showErrorToast: false })
  }

  async getTodoTransactionResponse(id, connection) {
    return await axios.get(`${connection.picoBackendURL}/${this.endpoint}/${id}`, { connection, showLoading: false, showErrorToast: false })
  }

  async searchTodoTransactions(query, { page, pageSize }, connection) {
    const url = this.getUrlForRequest({ url: `${connection.picoBackendURL}/api/search/transactions`, filters: [{ field: 'query', value: query }], page, pageSize })
    const response = await axios.get(url, { connection, showLoading: false, showErrorToast: false })
    return response?.status === 200 ? response.data : undefined
  }
}
