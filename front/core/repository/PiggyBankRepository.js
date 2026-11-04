import BaseRepository from '~/core/repository/BaseRepository'

export default class PiggyBankRepository extends BaseRepository {
  constructor() {
    super(`api/piggy-banks`)
  }
}
