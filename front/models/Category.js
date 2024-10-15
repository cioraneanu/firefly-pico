import BaseModel from '~/models/BaseModel'
import CategoryTransformer from '~/transformers/CategoryTransformer'
import CategoryRepository from '~/repository/CategoryRepository'
import _ from 'lodash'

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

  static getIcon(category) {
    return _.get(category, 'attributes.icon.icon')
  }
}

export default Category
