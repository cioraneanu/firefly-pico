import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import _ from 'lodash'

class TransactionRepository extends BaseRepository {
  constructor () {
    super(`api/transactions`)
  }

  async searchTransaction ({ filters = [], page = 1, pageSize = 50 } = {}) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/search/transactions`
    let searchUrl = this.getUrlForRequest({ filters, page, pageSize, url })
    let response = await axios.get(searchUrl)
    return _.get(response, 'data', {})
  }

}

export default TransactionRepository
