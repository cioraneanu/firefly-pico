import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import _ from 'lodash'

class TransactionTemplateRepository extends BaseRepository {
  constructor() {
    super(`api/transaction-templates`)
  }

  // async getOne (id) {
  //   // const baseURL = this.getBaseUrl()
  //   let result = await axios.get(`${this.endpoint}/${id}`)
  //   return _.get(result, 'data', {})
  // }
  //
  // async getAll ({ filters = [], page = 1, pageSize = 10 } = {}) {
  //   let url = this.getUrlForRequest({ filters, page, pageSize })
  //   let response = await axios.get(url)
  //   return _.get(response, 'data', {})
  // }
}

export default TransactionTemplateRepository
