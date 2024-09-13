import BaseModel from '~/models/BaseModel'
import CategoryTransformer from '~/transformers/CategoryTransformer'
import CategoryRepository from '~/repository/CategoryRepository'
import _ from 'lodash'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetRepository from '~/repository/BudgetRepository.js'
import { useDataStore } from '~/stores/dataStore.js'

export default class Budget extends BaseModel {
  getTransformer() {
    return BudgetTransformer
  }

  getRepository() {
    return new BudgetRepository()
  }

  getEmpty() {
    const dataStore = useDataStore()
    return {
      attributes: {
        name: '',
        icon: null,
        auto_budget_type: Budget.types.fixed,
        auto_budget_period: Budget.periods.monthly,
        currency: dataStore.defaultCurrency
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

  // --------


  static get types() {
    return {
      manual: {
        name: 'No auto-budget',
        fireflyCode: null,
      },
      fixed: {
        name: 'Fixed amount every period',
        fireflyCode: 'reset',
      },
      add: {
        name: 'Add amount every period',
        fireflyCode: 'rollover',
      },
      adjusted: {
        name: 'Add amount every period + correct overspending',
        fireflyCode: 'adjusted',
      },
    }
  }

  static typesList() {
    return Object.values(this.types)
  }

  // --------

  // --------


  static get periods() {
    return {
      daily: {
        name: 'Daily',
        fireflyCode: 'daily',
      },
      weekly: {
        name: 'Weekly',
        fireflyCode: 'weekly',
      },
      monthly: {
        name: 'Monthly',
        fireflyCode: 'monthly',
      },
      quarterly: {
        name: 'Quarterly',
        fireflyCode: 'quarterly',
      },
      halfYear: {
        name: 'Every half year',
        fireflyCode: 'half_year',
      },
      yearly: {
        name: 'Yearly',
        fireflyCode: 'yearly',
      },
    }
  }

  static periodsList() {
    return Object.values(this.periods)
  }

  // --------

}

