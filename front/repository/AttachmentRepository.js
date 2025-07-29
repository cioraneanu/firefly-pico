import BaseRepository from '~/repository/BaseRepository'

export default class AttachmentRepository extends BaseRepository {
  constructor() {
    super('api/attachments')
  }
}