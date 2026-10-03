import BaseRepository from '~/repository/BaseRepository'

export default class CustomIconRepository extends BaseRepository {
  constructor() {
    super('api/custom-icons')
  }

  getFileUrl(file) {
    return `${this.getUrl()}/${encodeURIComponent(file)}`
  }
}
