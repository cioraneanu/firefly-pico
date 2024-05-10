import BaseRepository from '~/repository/BaseRepository'

class AccountRepository extends BaseRepository {
  constructor() {
    super('api/accounts')
  }
}

export default AccountRepository
