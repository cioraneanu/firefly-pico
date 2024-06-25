import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'
import _ from 'lodash'

class ProfileRepository extends BaseRepository {
  constructor() {
    super('api/profile')
  }

  async getSettings() {
    let result = await axios.get(`${this.getUrl()}`)
    return _.get(result, 'data', {})
  }

  async writeSettings(data) {
    let result = await axios.put(`${this.getUrl()}`, data)
    return result
  }
}

export default ProfileRepository
