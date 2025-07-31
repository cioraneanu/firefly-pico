import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import { get } from 'lodash'
import { getGUID } from '~/utils/Utils.js'
import { translate } from '~/plugins/plugin-i18n.js'

export default class AttachmentRepository extends BaseRepository {
  constructor() {
    super('api/attachments')
  }

  async getForTransaction(id) {
    const url = `${useAppStore().picoBackendURL}/api/transactions/${id}/attachments`
    return await axios.get(url)
  }

  async uploadForTransaction(id, file) {
    // 2 step process. First create an instance of Attachment and then Upload actual content to it
    const urlStep1 = `${useAppStore().picoBackendURL}/api/attachments`
    const bodyStep1 = {
      filename: file.name ?? getGUID(),
      attachable_type: 'TransactionJournal',
      attachable_id: id,
    }
    let responseStep1 = await axios.post(urlStep1, bodyStep1)
    if (!ResponseUtils.isSuccess(responseStep1)) {
      return
    }

    let attachmentId = get(responseStep1, 'data.data.id')

    const urlStep2 = `${useAppStore().picoBackendURL}/api/attachments/${attachmentId}/upload`

    // const formData = new FormData()
    // formData.append('file', file)
    const arrayBuffer = await file.arrayBuffer()
    const responseStep2 = await axios.post(urlStep2, arrayBuffer, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!ResponseUtils.isSuccess(responseStep2)) {
      // If upload failed, try to keep things clean and delete the attachment entry
      await this.delete(attachmentId)
      return
    }

    UIUtils.showToastSuccess(translate('success'))
  }
}
