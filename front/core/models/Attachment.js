import { faker } from '@faker-js/faker'
import BaseModel from '~/core/models/BaseModel'
import AccountTransformer from '~/core/transformers/AccountTransformer'
import AccountRepository from '~/core/repository/AccountRepository'
import { get } from 'lodash-es'
import Transaction from '~/core/models/Transaction'
import { NUMBER_FORMAT } from '~/core/utils/NumberUtils.js'
import Currency from '~/core/models/Currency.js'
import AttachmentTransformer from '~/core/transformers/AttachmentTransformer.js'
import AttachmentRepository from '~/core/repository/AttachmentRepository.js'

export default class Attachment extends BaseModel {
  getTransformer() {
    return AttachmentTransformer
  }

  getRepository() {
    return new AttachmentRepository()
  }

  getEmpty() {
    return {
      type: 'attachments',
      attributes: {
        attachable_type: '',
        attachable_id: '',
      },
    }
  }
}
