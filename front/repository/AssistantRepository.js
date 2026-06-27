import axios from 'axios'
import { get } from 'lodash-es'
import BaseRepository from '~/repository/BaseRepository.js'

export default class AssistantRepository extends BaseRepository {
  constructor() {
    super('api/assistant')
  }

  async interpretTransactions(data) {
    const response = await axios.post(`${this.getUrl()}/interpret-transactions`, data)
    return get(response, 'data', {})
  }
}
