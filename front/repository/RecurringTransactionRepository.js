import BaseRepository from '~/repository/BaseRepository'

export default class RecurringTransactionRepository extends BaseRepository {
  constructor() {
    super(`api/recurrences`)
  }
}
