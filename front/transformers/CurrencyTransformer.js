import _ from 'lodash'
import DateUtils from '~/utils/DateUtils'
import Account from '~/models/Account'
import Utils from '~/utils/Utils'
import ApiTransformer from '~/transformers/ApiTransformer'

export default class CurrencyTransformer extends ApiTransformer {
  static transformFromApi (item) {
    if (!item) {
      return null
    }
    return item
  }

  static transformToApi (item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    let result = _.pick(data, ['name', 'code', 'symbol', 'decimal_places', 'enabled', 'default'])

    return result
  }
}