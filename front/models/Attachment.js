import { faker } from '@faker-js/faker'
import BaseModel from '~/models/BaseModel'
import AccountTransformer from '~/transformers/AccountTransformer'
import AccountRepository from '~/repository/AccountRepository'
import { get } from 'lodash'
import Transaction from '~/models/Transaction'
import { NUMBER_FORMAT } from '~/utils/NumberUtils.js'
import Currency from '~/models/Currency.js'
import AttachmentTransformer from '~/transformers/AttachmentTransformer.js'
import AttachmentRepository from '~/repository/AttachmentRepository.js'

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
