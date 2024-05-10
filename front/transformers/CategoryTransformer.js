import _, { get } from 'lodash'
import DateUtils from '~/utils/DateUtils'
import Account from '~/models/Account'
import Utils from '~/utils/Utils'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'

export default class CategoryTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))

    // Utils.stringToData(item, 'data.attributes.account_role', Account.roleAssetsList())
    // Utils.stringToData(item, 'data.attributes.type', Account.typesList())
    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    return {
      name: get(data, 'name', '').toLowerCase(),
      icon: get(data, 'icon.icon'),
    }
  }
}
