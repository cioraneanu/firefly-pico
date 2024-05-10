import { get } from 'lodash'
import BaseModel from '~/models/BaseModel'
import TagRepository from '~/repository/TagRepository'
import TagTransformer from '~/transformers/TagTransformer'
import { ellipsizeText } from '~/utils/Utils.js'

class Tag extends BaseModel {
  getTransformer() {
    return TagTransformer
  }

  getRepository() {
    return new TagRepository()
  }

  getEmpty() {
    return {
      name: '',
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

  static getDisplayName(tag, ellipsizeLength = 100) {
    const name = get(tag, 'attributes.tag') ?? ''
    return ellipsizeText(name, ellipsizeLength)
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

  static getTagWithParents2 = (list, tag) => {
    const result = []

    // Helper function to find node by tag
    function findNode(node) {
      result.push(node)
      // If parent exists, recursively find its parent
      if (node.parent_id !== null) {
        const parent = list.find((item) => item.id === node.parent_id)
        findNode(parent)
      }
    }

    // Find the node with the given tag
    const node = list.find((item) => item.id === tag || item.parent_id === tag)
    if (node) {
      findNode(node)
    }

    return result
  }
}

export default Tag
