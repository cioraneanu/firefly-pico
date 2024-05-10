import { get } from 'lodash'
import BaseModel from '~/models/BaseModel'
import CurrencyRepository from '~/repository/CurrencyRepository'
import CurrencyTransformer from '~/transformers/CurrencyTransformer'

class Currency extends BaseModel {
  getTransformer() {
    return CurrencyTransformer
  }

  getRepository() {
    return new CurrencyRepository()
  }

  getEmpty() {
    return {
      name: '',
      code: '',
      symbol: '',
      decimal_places: '2',
      enabled: true,
      default: true,
    }
  }

  // ------------

  getFake(id) {
    return {
      type: 'currencies',
      attributes: {},
    }
  }

  // --------

  static getDisplayName(account) {
    const name = get(account, 'attributes.name')
    const symbol = get(account, 'attributes.symbol')
    return `${name}, ${symbol}`
  }
}

export default Currency
