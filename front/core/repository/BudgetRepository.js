import BaseRepository from '~/core/repository/BaseRepository'

export default class BudgetRepository extends BaseRepository {
  constructor() {
    super(`api/budgets`)
  }
}
