import { cloneDeep, get } from 'lodash-es'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'

export default class AttachmentTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    item.attributes.download_url = convertFireflyToPicoUrl(item.attributes.download_url)

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
