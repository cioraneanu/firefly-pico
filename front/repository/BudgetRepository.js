import axios from 'axios'
import { get } from 'lodash-es'
import BaseRepository from '~/repository/BaseRepository'

export default class BudgetRepository extends BaseRepository {
  constructor() {
    super(`api/budgets`)
  }

  async getLimitsForBudget(budgetId, { start, end, showLoading = false, timeout = undefined } = {}) {
    const url = `${this.getUrl()}/${budgetId}/limits`
    const params = new URLSearchParams()
    // Only add date filters if provided — fetching without filters avoids Firefly server timeout
    // on wide date ranges, and we filter results client-side instead
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url
    const response = await axios.get(fullUrl, { showLoading, timeout })
    return get(response, 'data', {})
  }
}
