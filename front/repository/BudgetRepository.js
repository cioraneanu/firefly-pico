import BaseRepository from '~/repository/BaseRepository'
import { faker } from '@faker-js/faker'
import axios from 'axios'
import _ from 'lodash'

export default class BudgetRepository extends BaseRepository {
  constructor() {
    super(`api/budgets`)
  }

  async getAllBudgetLimits({ filters = [], page = 1, pageSize = 50 } = {}) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/search/transactions`
    let searchUrl = this.getUrlForRequest({ filters, page, pageSize, url })
    let response = await axios.get(searchUrl)
    return _.get(response, 'data', {})
  }
}

