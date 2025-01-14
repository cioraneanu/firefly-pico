import BaseModel from '~/models/BaseModel'
import CategoryTransformer from '~/transformers/CategoryTransformer'
import CategoryRepository from '~/repository/CategoryRepository'
import _ from 'lodash'
import { ellipsizeText } from '~/utils/Utils.js'

class Category extends BaseModel {
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
      }
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
    return _.get(category, 'attributes.name')
  }

  static getDisplayNameEllipsized(category, ellipsizeLength = 100) {
    return ellipsizeText(this.getDisplayName(category), ellipsizeLength)
  }

  static getIcon(category) {
    return _.get(category, 'attributes.icon.icon')
  }
}

export default Category
