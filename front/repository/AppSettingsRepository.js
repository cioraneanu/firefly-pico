import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'
import _ from 'lodash'

class AppSettingsRepository extends BaseRepository {
  constructor() {
    super('api/app_settings')
  }

  async getSettings(authToken) {
    let result = await axios.get(`${this.getUrl()}?auth_token=${authToken}`)
    return _.get(result, 'data', {})
  }

  async writeSettings(authToken, data) {
    let result = await axios.put(`${this.getUrl()}?auth_token=${authToken}`, data)
    return result
  }
}

export default AppSettingsRepository
