import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'

export default class InfoRepository extends BaseRepository {
  constructor () {
    super('api/latest-version')
  }

  async getLatestVersion () {
    return await axios.get(`${this.getUrl()}`)
  }

}

