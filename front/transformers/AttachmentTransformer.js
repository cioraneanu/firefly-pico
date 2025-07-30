import { cloneDeep, get } from 'lodash'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'

export default class AttachmentTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    // item.attributes.download_url =
    // let newUrl = "http://127.0.0.1:8000/api/attachments/1/download"


    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }
    let newItem = cloneDeep(item)

    return newItem
  }
}
