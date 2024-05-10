import _ from 'lodash'
import ApiTransformer from '~/transformers/ApiTransformer'

export default class CurrencyTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    let data = _.get(item, 'attributes')
    let result = _.pick(data, ['name', 'code', 'symbol', 'decimal_places', 'enabled', 'default'])

    return result
  }
}
