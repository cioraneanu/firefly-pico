import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'

export default class AttachmentRepository extends BaseRepository {
  constructor() {
    super('api/attachments')
  }

  async getForTransaction(id) {
    const appStore = useAppStore()
    const url = `${appStore.picoBackendURL}/api/transactions/${id}/attachments`
    return await axios.get(url)
  }
}