import axios from 'axios'
import { get } from 'lodash-es'
import BaseRepository from '~/repository/BaseRepository'

export default class RecurringTransactionRepository extends BaseRepository {
  constructor() {
    super(`api/recurrences`)
  }

  async getTransactionsByRecurringId(recurringId, { filters = [], page = 1, pageSize = 50, showLoading = false, timeout = undefined } = {}) {
    let url = `${this.getUrl()}/${recurringId}/transactions`
    const params = new URLSearchParams({ limit: pageSize, page })
    if (filters && filters.length > 0) {
      params.append('query', filters.join(' '))
    }
    const fullUrl = `${url}?${params.toString()}`
    let response = await axios.get(fullUrl, { showLoading, timeout })
    return get(response, 'data', {})
  }
}
