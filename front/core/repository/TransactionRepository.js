import BaseRepository from '~/core/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash-es'

export default class TransactionRepository extends BaseRepository {
  constructor() {
    super(`api/transactions`)
    this.searchTransaction = this.searchTransaction.bind(this)
  }

  async searchTransaction({ filters = [], page = 1, pageSize = 50 } = {}) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/search/transactions`
    let searchUrl = this.getUrlForRequest({ filters, page, pageSize, url })
    let response = await axios.get(searchUrl)
    return get(response, 'data', {})
  }

  async searchTransactionsTotal({ filters = [] } = {}) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/search/transactions/total`
    let searchUrl = this.getUrlForRequest({ filters, page: null, pageSize: null, url })
    // 422 = more transactions match than the backend sums: a normal answer (no error toast), shown next to the total
    return await axios.get(searchUrl, { validateStatus: (status) => status === 200 || status === 422 })
  }
}
