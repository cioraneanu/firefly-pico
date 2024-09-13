import BaseRepository from '~/repository/BaseRepository'
import { faker } from '@faker-js/faker'

export default class BudgetRepository extends BaseRepository {
  constructor() {
    super(`api/budgets`)
  }
}

