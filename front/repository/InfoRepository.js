import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'

export default class InfoRepository extends BaseRepository {
  constructor() {
    super('api/latest-version')
  }

  async getLatestVersion() {
    return await axios.get(`${this.getUrl()}`)
  }
}
