import BaseRepository from '~/core/repository/BaseRepository'
import axios from 'axios'
import { cloneDeep, get } from 'lodash-es'
import Account from '~/core/models/Account'
import AccountTransformer from '~/core/transformers/AccountTransformer'

export default class AccountRepository extends BaseRepository {
  constructor() {
    super('api/accounts')
  }

  async getGroups(text) {
    const url = `${useAppStore().picoBackendURL}/api/accounts/groups?text=${encodeURIComponent(text)}`
    let response = await axios.get(url)
    return get(response, 'data') ?? []
  }

  async adjustBalance(account, balance) {
    const body = cloneDeep(account)
    body.attributes.opening_balance = parseFloat(body.attributes.opening_balance) + parseFloat(balance) - parseFloat(Account.getBalance(account))
    return await this.update(account.id, AccountTransformer.transformToApi(body))
  }
}
