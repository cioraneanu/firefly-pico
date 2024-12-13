import BaseRepository from '~/repository/BaseRepository'

class CategoryRepository extends BaseRepository {
  constructor() {
    super(`api/categories`)
  }
}

export default CategoryRepository
