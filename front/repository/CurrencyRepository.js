import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'

export default class CurrencyRepository extends BaseRepository {
  constructor() {
    super(`api/currencies`)
  }

  async update(id, data) {
    return await axios.put(`${this.getUrl()}/${data.code}`, data)
  }

  async delete(id) {
    let dataStore = useDataStore()
    let currencyCode = dataStore.currencyDictionary[id]?.attributes?.code
    return await axios.delete(`${this.getUrl()}/${currencyCode}`)
  }

  async getCurrencyExchange() {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/currencies/exchange`
    let response = await axios.get(url)
    return get(response, 'data', {})
  }
}
