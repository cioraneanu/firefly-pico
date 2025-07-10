import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'
import { get } from 'lodash'

export default class ProfileRepository extends BaseRepository {
  constructor() {
    super('api/profiles')
  }

  async getProfile() {
    let result = await axios.get(`${this.getUrl()}`)
    return get(result, 'data', {})
  }

  async writeProfile(data) {
    return await axios.put(`${this.getUrl()}`, data)
  }
}
