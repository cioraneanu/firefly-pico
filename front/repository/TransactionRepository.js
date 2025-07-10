import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'

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
}

