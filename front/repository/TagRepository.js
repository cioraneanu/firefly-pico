import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'

export default class TagRepository extends BaseRepository {
  constructor() {
    super('api/tags')
  }

  async computeTotal(id) {
    return await axios.post(`${this.getUrl()}/${id}/total`)
  }
}
