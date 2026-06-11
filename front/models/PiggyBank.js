import BaseModel from '~/models/BaseModel'
import { get } from 'lodash-es'
import PiggyBankTransformer from '~/transformers/PiggyBankTransformer.js'
import PiggyBankRepository from '~/repository/PiggyBankRepository.js'

export default class PiggyBank extends BaseModel {
  getTransformer() {
    return PiggyBankTransformer
  }

  getRepository() {
    return new PiggyBankRepository()
  }

  getEmpty() {
    return {
      attributes: {
        name: '',
        icon: null,
        account: null,
        target_amount: null,
        current_amount: null,
        start_date: new Date(),
        target_date: null,
        notes: '',
      },
    }
  }

  // ------------

  getFake(id) {
    return {}
  }

  // --------

  static getDisplayName(piggyBank) {
    return get(piggyBank, 'attributes.name')
  }

  static getAccount(piggyBank) {
    return get(piggyBank, 'attributes.account')
  }

  static getTargetAmount(piggyBank) {
    return parseFloat(get(piggyBank, 'attributes.target_amount') ?? 0)
  }

  static getCurrentAmount(piggyBank) {
    return parseFloat(get(piggyBank, 'attributes.current_amount') ?? 0)
  }

  static getLeftToSave(piggyBank) {
    return Math.max(this.getTargetAmount(piggyBank) - this.getCurrentAmount(piggyBank), 0)
  }

  static getPercent(piggyBank) {
    let targetAmount = this.getTargetAmount(piggyBank)
    if (targetAmount === 0) {
      return 0
    }
    return (this.getCurrentAmount(piggyBank) / targetAmount) * 100
  }

  static getTargetDate(piggyBank) {
    return get(piggyBank, 'attributes.target_date')
  }

  // --------

  static getCurrencySymbol(piggyBank) {
    const currencyStore = useCurrencyStore()
    return get(piggyBank, 'attributes.currency.attributes.symbol', get(currencyStore.defaultCurrency, 'attributes.symbol'))
  }
}
