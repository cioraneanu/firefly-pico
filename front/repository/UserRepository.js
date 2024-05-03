import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'

export default class UserRepository extends BaseRepository {
  constructor () {
    super('api/user')
  }

  async getUser () {
    return await axios.get(`${this.getUrl()}`)
  }

}

