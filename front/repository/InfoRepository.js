import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'

export default class InfoRepository extends BaseRepository {
  constructor() {
    super('api/info')
  }

  async getInfo({ showLoading = true } = {}) {
    return await axios.get(`${this.getUrl()}`, { showLoading, showErrorToast: false })
  }
}
