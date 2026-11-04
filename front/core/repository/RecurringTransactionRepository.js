import BaseRepository from '~/core/repository/BaseRepository'

export default class RecurringTransactionRepository extends BaseRepository {
  constructor() {
    super(`api/recurrences`)
  }
}
