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

  async getTodoTransaction(id) {
    const response = await axios.get(`${this.getUrl()}/${id}`, { showLoading: false, showErrorToast: false })
    return get(response, 'data.data')
  }

  async updateTodoTags(id, data) {
    return await axios.put(`${this.getUrl()}/${id}`, data, { showLoading: false, showErrorToast: false })
  }
}
