import BaseModel from '~/models/BaseModel'
import TagRepository from '~/repository/TagRepository'
import TagTransformer from '~/transformers/TagTransformer'
import { get } from 'lodash'
import { ellipsizeText } from '~/utils/Utils.js'

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

  static getTagWithParents = (tag) => {
    const dataStore = useDataStore()
    let result = [tag]
    let tagParentId = get(tag, 'attributes.parent_id')

    while (tagParentId) {
      let parentTag = dataStore.tagDictionaryById[tagParentId]

      if (parentTag) {
        result.push(parentTag)
      }
      tagParentId = get(parentTag, 'attributes.parent_id')
    }
    return result
  }

}
