import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'

export default class UserRepository extends BaseRepository {
  constructor() {
    super('api/user')
  }

  async getUser() {
    return await axios.get(`${this.getUrl()}`)
  }
}
