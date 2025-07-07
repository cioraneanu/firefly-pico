import BaseRepository from '~/repository/BaseRepository'

export default class TagRepository extends BaseRepository {
  constructor() {
    super('api/tags')
  }
}

