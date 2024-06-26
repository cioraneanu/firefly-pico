import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import _ from 'lodash'

class CurrencyRepository extends BaseRepository {
  constructor() {
    super(`api/currencies`)
  }

  async getCurrencyExchange() {
    const profileStore = useProfileStore()
    const url = `${profileStore.picoBackendURL}/api/currencies/exchange`
    let response = await axios.get(url)
    return _.get(response, 'data', {})
  }
}

export default CurrencyRepository
