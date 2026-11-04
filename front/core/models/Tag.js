import BaseModel from '~/core/models/BaseModel'
import TagRepository from '~/core/repository/TagRepository'
import TagTransformer from '~/core/transformers/TagTransformer'
import Currency from '~/core/models/Currency.js'
import { get } from 'lodash-es'
import { ellipsizeText } from '~/core/utils/Utils.js'

export default class Tag extends BaseModel {
  getTransformer() {
    return TagTransformer
  }

  getRepository() {
    return new TagRepository()
  }

  getEmpty() {
    return {
      attributes: {
        tag: '',
        parentTag: null,
        icon: null,
        is_todo: false,
      },
    }
  }

  // ------------

  getFake(id) {
    return {
      type: 'tags',
      attributes: {
        tag: '',
        date: null,
        description: null,
        longitude: null,
        latitude: null,
        zoom_level: null,
      },
    }
  }

  // --------------

  static getDisplayName(tag) {
    return get(tag, 'attributes.tag') ?? ''
  }

  static getDisplayNameEllipsized(tag, ellipsizeLength = 100) {
    return ellipsizeText(this.getDisplayName(tag), ellipsizeLength)
  }

  static getTotalFormatted(tag) {
    return Currency.formatAmountWithSymbol(get(tag, 'attributes.total_amount'), get(tag, 'attributes.total_currency_id'))
  }

  static getTagWithParents = (tag) => {
    const tagStore = useTagStore()
    let result = [tag]
    let tagParentId = get(tag, 'attributes.parent_id')

    while (tagParentId) {
      let parentTag = tagStore.tagDictionaryById[tagParentId]

      if (parentTag) {
        result.push(parentTag)
      }
      tagParentId = get(parentTag, 'attributes.parent_id')
    }
    return result
  }
}
