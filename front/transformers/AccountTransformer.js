import _, { get } from 'lodash'
import Account from '~/models/Account'
import Icon from '~/models/Icon.js'
import { useDataStore } from '~/stores/dataStore'
import ApiTransformer from '~/transformers/ApiTransformer'

export default class AccountTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    const dataStore = useDataStore()
    const currencyDictionary = dataStore.currencyDictionary

    // Utils.stringToData(item, 'attributes.account_role', Account.roleAssetsList)
    // Utils.stringToData(item, 'attributes.type', Account.typesList)

    item.attributes.account_role = Account.roleAssetsList().find(
      (role) => role.fireflyCode === item.attributes.account_role,
    )
    item.attributes.type = Account.typesList().find((type) => type.fireflyCode === item.attributes.type)

    let currencyId = get(item, 'attributes.currency_id')
    item.attributes.currency = currencyDictionary[currencyId]
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
      type: get(data, 'type.fireflyCode'),
      account_role: get(data, 'account_role.fireflyCode'),
      currency_id: get(data, 'currency.id'),
      currency_code: get(data, 'currency.attributes.code'),
    }
  }
}
