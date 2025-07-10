import BaseRepository from '~/repository/BaseRepository'

export default class AccountRepository extends BaseRepository {
  constructor() {
    super('api/accounts')
  }
}