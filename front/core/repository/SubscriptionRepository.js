import BaseRepository from '~/core/repository/BaseRepository'

export default class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(`api/bills`)
  }
}
