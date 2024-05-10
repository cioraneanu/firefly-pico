import _, { isEqual } from 'lodash'
import BaseModel from '~/models/BaseModel'
import Transaction from '~/models/Transaction'
import TransactionTemplateRepository from '~/repository/TransactionTemplateRepository'
import TransactionTemplateTransformer from '~/transformers/TransactionTemplateTransformer'

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
    return _.get(item, 'name')
  }
}
