import BaseRepository from '~/repository/BaseRepository'

export default class TransactionTemplateRepository extends BaseRepository {
  constructor() {
    super(`api/transaction-templates`)
  }
}
