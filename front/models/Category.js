import _ from 'lodash'
import BaseModel from '~/models/BaseModel'
import CategoryRepository from '~/repository/CategoryRepository'
import CategoryTransformer from '~/transformers/CategoryTransformer'

class Category extends BaseModel {
  getTransformer() {
    return CategoryTransformer
  }

  getRepository() {
    return new CategoryRepository()
  }

  getEmpty() {
    return {
      name: '',
      type: null,
      role: null,
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

  static getDisplayName(account) {
    return _.get(account, 'attributes.name')
  }
}

export default Category
