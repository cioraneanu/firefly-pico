import BaseRepository from '~/repository/BaseRepository'

export default class BudgetLimitRepository extends BaseRepository {
  constructor() {
    super(`api/budget-limits`)
  }
}
