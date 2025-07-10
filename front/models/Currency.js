import BaseModel from '~/models/BaseModel'
import { get } from 'lodash'
import CurrencyTransformer from '~/transformers/CurrencyTransformer'
import CurrencyRepository from '~/repository/CurrencyRepository'

export default class Currency extends BaseModel {
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

  static getSymbol(currency) {
    return get(currency, 'attributes.symbol')
  }

  static getCode(currency) {
    return get(currency, 'attributes.code')
  }

  static getName(currency) {
    return get(currency, 'attributes.name')
  }

  static getDecimalPlaces(currency) {
    return get(currency, 'attributes.decimal_places')
  }

  static getDisplayName(currency) {
    return `${this.getName(currency)}, ${this.getSymbol(currency)}`
  }
}
