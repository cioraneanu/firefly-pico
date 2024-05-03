import BaseRepository from '~/repository/BaseRepository'
import { faker } from '@faker-js/faker'

class CategoryRepository extends BaseRepository {
  constructor () {
    super(`api/categories`)
  }

}

export default CategoryRepository
