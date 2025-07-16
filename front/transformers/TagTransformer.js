import { get } from 'lodash'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'

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

    item.attributes.date = DateUtils.stringToDate(get(item, 'attributes.date'))
    item.attributes.icon = Icon.getIcon(get(item, 'attributes.icon'))
    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    return {
      tag: get(item, 'attributes.tag'),
      description: get(item, 'attributes.description'),
      date: DateUtils.dateToString(get(item, 'attributes.date')),
      parent_id: get(item, 'attributes.parentTag.id'),
      icon: get(item, 'attributes.icon.icon', null),
      is_todo: get(item, 'attributes.is_todo', false),
    }
  }
}
