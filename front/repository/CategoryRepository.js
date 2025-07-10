import BaseRepository from '~/repository/BaseRepository'

export default class CategoryRepository extends BaseRepository {
  constructor() {
    super(`api/categories`)
  }
}