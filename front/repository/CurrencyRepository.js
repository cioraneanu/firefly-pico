import axios from 'axios'
import _ from 'lodash'
import BaseRepository from '~/repository/BaseRepository'

class CurrencyRepository extends BaseRepository {
  constructor() {
    super(`api/currencies`)
  }

  async getCurrencyExchange() {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/currencies/exchange`
    let response = await axios.get(url)
    return _.get(response, 'data', {})
  }
}

export default CurrencyRepository
