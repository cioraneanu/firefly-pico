import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'

export default class BudgetRepository extends BaseRepository {
  constructor() {
    super(`api/budgets`)
  }

  async getBudgetLimits() {
    const appStore = useAppStore()
    let response = await axios.get(`${appStore.picoBackendURL}/api/budget-limits`)
    return get(response, 'data', {})
  }
}
