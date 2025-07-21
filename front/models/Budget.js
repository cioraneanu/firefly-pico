import BaseModel from '~/models/BaseModel'
import { get } from 'lodash'
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
    const dataStore = useDataStore()
    return {
      attributes: {
        name: '',
        active: true,
        icon: null,
        auto_budget_type: Budget.types.fixed,
        auto_budget_period: Budget.periods.monthly,
        currency: dataStore.defaultCurrency,
      },
    }
  }

  // ------------

  getFake(id) {
    return {}
  }

  // --------

  static getDisplayName(budget) {
    return get(budget, 'attributes.name')
  }

  // --------

  static getCurrencySymbol(budget) {
    const dataStore = useDataStore()
    return get(budget, 'attributes.currency.attributes.symbol', get(dataStore.defaultCurrency, 'attributes.symbol'))
  }

  static isActive(budget) {
    return get(budget, 'attributes.active')
  }

  // --------

  static get types() {
    return {
      manual: {
        name: 'Manual',
        fireflyCode: 0,
      },
      fixed: {
        name: 'Reset every period',
        fireflyCode: 'reset',
      },
      add: {
        name: 'Add every period',
        fireflyCode: 'rollover',
      },
      adjusted: {
        name: 'Add every period - overspending',
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

  static getLimit(budget) {
    if (!budget) {
      return null
    }
    const dataStore = useDataStore()
    return dataStore.budgetLimitDictionary[budget.id]
  }
}
