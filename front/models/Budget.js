import BaseModel from '~/models/BaseModel'
import CategoryTransformer from '~/transformers/CategoryTransformer'
import CategoryRepository from '~/repository/CategoryRepository'
import _ from 'lodash'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetRepository from '~/repository/BudgetRepository.js'

export default class Budget extends BaseModel {
  getTransformer() {
    return BudgetTransformer
  }

  getRepository() {
    return new BudgetRepository()
  }

  getEmpty() {
    return {
      attributes: {
        name: '',
        icon: null,
      }
    }
  }

  // ------------

  getFake(id) {
    return {
    }
  }

  // --------

  static getDisplayName(account) {
    return _.get(account, 'attributes.name')
  }
}

