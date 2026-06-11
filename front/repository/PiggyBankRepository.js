import BaseRepository from '~/repository/BaseRepository'

export default class PiggyBankRepository extends BaseRepository {
  constructor() {
    super(`api/piggy-banks`)
  }
}
