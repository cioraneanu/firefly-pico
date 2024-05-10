import { get } from 'lodash'
import Icon from '~/models/Icon.js'
import ApiTransformer from '~/transformers/ApiTransformer'

export default class TagTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }
    // const dataStore = useDataStore()
    //
    // let parentTagId = get(item, 'attributes.parent_id')
    // if (parentTagId) {
    //   item.attributes.parentTag = dataStore.tagDictionaryById[parentTagId]
    // }

    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    return {
      tag: LanguageUtils.removeAccents(get(item, 'attributes.tag')),
      parent_id: get(item, 'attributes.parentTag.id'),
      icon: get(item, 'attributes.icon.icon', null),
      is_todo: get(item, 'attributes.is_todo', false),
    }
  }
}
