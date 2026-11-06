import BaseRepository from '~/core/repository/BaseRepository'
import axios from 'axios'

export default class UserRepository extends BaseRepository {
  constructor() {
    super('api/user')
  }

  async getUser(connection) {
    const url = connection ? `${connection.picoBackendURL}/${this.endpoint}` : this.getUrl()
    return await axios.get(url, { connection })
  }
}
