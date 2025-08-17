import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'
import { endOfMonth, startOfMonth } from 'date-fns'

export default class BudgetRepository extends BaseRepository {
  constructor() {
    super(`api/budgets`)
  }

  async getBudgetLimits() {
    const appStore = useAppStore()
    let start = startOfMonth(new Date())
    let end = endOfMonth(new Date())
    let urlParams = `start=${DateUtils.dateToString(start)}&end=${DateUtils.dateToString(end)}`
    // let urlParams = `start=2025-08-01&end=2025-08-30`

    let response = await axios.get(`${appStore.picoBackendURL}/api/budget-limits?${urlParams}`)
    return get(response, 'data', {})
  }
}
