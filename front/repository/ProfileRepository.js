import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'
import _ from 'lodash'

class ProfileRepository extends BaseRepository {
  constructor() {
    super('api/profiles')
  }

  async getProfile() {
    let result = await axios.get(`${this.getUrl()}`)
    return _.get(result, 'data', {})
  }

  async writeProfile(data) {
    let result = await axios.put(`${this.getUrl()}`, data)
    return result
  }
}

export default ProfileRepository
