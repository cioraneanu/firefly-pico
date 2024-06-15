import BaseModel from '~/models/BaseModel'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'
import TransactionTemplateRepository from '~/repository/TransactionTemplateRepository'
import Transaction from '~/models/Transaction'
import { get, isEqual } from 'lodash'

export default class TransactionTemplate extends BaseModel {
  getTransformer() {
    return TransactionTemplateTransformer
  }

  getRepository() {
    return new TransactionTemplateRepository()
  }

  getEmpty() {
    let type = Transaction.typesList.find((item) => isEqual(item, Transaction.types.expense))
    return {
      type: type,
      amount: '',
      tags: [],
      description: '',
      notes: '',
      accountSource: null,
      accountDestination: null,
      category: null,
    }
  }

  // ------------

  getFake(id) {
    return {}
  }

  static getDisplayName(item) {
    return get(item, 'name')
  }

  static getExtraNames(item) {
    return (get(item, 'extra_names') ?? []).map((item) => item.value)
  }

  static getAllNames(item) {
    return [this.getDisplayName(item), ...this.getExtraNames(item)]
  }
}
