import BaseModel from '~/core/models/BaseModel'
import CategoryTransformer from '~/core/transformers/CategoryTransformer'
import CategoryRepository from '~/core/repository/CategoryRepository'
import { get } from 'lodash-es'
import { ellipsizeText } from '~/core/utils/Utils.js'

export default class Category extends BaseModel {
  getTransformer() {
    return CategoryTransformer
  }

  getRepository() {
    return new CategoryRepository()
  }

  getEmpty() {
    return {
      attributes: {
        name: '',
        icon: null,
      },
    }
  }

  // ------------

  getFake(id) {
    return {
      type: 'categories',
      attributes: {
        name: '',
        notes: null,
      },
    }
  }

  // --------

  static getDisplayName(category) {
    return get(category, 'attributes.name')
  }

  static getDisplayNameEllipsized(category, ellipsizeLength = 100) {
    return ellipsizeText(this.getDisplayName(category), ellipsizeLength)
  }

  static getIcon(category) {
    return get(category, 'attributes.icon.icon')
  }
}

