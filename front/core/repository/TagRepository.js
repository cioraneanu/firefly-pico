import axios from 'axios'
import BaseRepository from '~/core/repository/BaseRepository'

export default class TagRepository extends BaseRepository {
  constructor() {
    super('api/tags')
  }

  async computeTotal(id) {
    return await axios.post(`${this.getUrl()}/${id}/total`)
  }

  async getTodoTransactions(id, { start, end, page, pageSize }, connection) {
    const url = this.getUrlForRequest({
      url: `${connection.picoBackendURL}/${this.endpoint}/${encodeURIComponent(id)}/transactions`,
      filters: [
        { field: 'start', value: start },
        { field: 'end', value: end },
      ],
      page,
      pageSize,
    })
    const response = await axios.get(url, { connection, showLoading: false, showErrorToast: false })
    return response?.status === 200 ? response.data : undefined
  }
}
