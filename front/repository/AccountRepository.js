import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'

export default class AccountRepository extends BaseRepository {
  constructor() {
    super('api/accounts')
  }

  async getGroups(text) {
    const url = `${useAppStore().picoBackendURL}/api/accounts/groups?text=${encodeURIComponent(text)}`
    let response = await axios.get(url)
    return get(response, 'data') ?? []
  }
}
