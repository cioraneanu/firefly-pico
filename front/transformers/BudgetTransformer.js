import _, { get } from 'lodash'
import DateUtils from '~/utils/DateUtils'
import Account from '~/models/Account'
import Utils from '~/utils/Utils'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'

export default class BudgetTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))
    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    return {
      name: get(data, 'name', ''),
      icon: get(data, 'icon.icon'),
    }
  }
}
