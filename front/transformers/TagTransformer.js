import { get } from 'lodash-es'
import ApiTransformer from '~/transformers/ApiTransformer'
import Icon from '~/models/Icon.js'

export default class TagTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }


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
