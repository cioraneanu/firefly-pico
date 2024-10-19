import { faker } from '@faker-js/faker'
import BaseModel from '~/models/BaseModel'
import AccountTransformer from '~/transformers/AccountTransformer'
import AccountRepository from '~/repository/AccountRepository'
import _, { get } from 'lodash'
import Transaction from '~/models/Transaction'
import { NUMBER_FORMAT } from '~/utils/MathUtils.js'

export default class Page {
  static get types() {
    return {
      transactionNew: {
        name: 'New transaction',
        code: 'transaction',
      },
      transactionList: {
        name: 'Transaction list',
        code: 'transactionList',
      },
      dashboard: {
        name: 'Dashboard',
        code: 'dashboard',
      },
    }
  }

  static typesList() {
    return Object.values(this.types)
  }
}
