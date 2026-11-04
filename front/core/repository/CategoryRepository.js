import BaseRepository from '~/core/repository/BaseRepository'

export default class CategoryRepository extends BaseRepository {
  constructor() {
    super(`api/categories`)
  }
}