import { get } from 'lodash'

export default class BaseModel {
  constructor() {}

  getEmpty() {
    throw 'Implement me'
  }

  getFake(id) {
    throw 'Implement me'
  }

  getFakeList() {
    let list = []
    for (let i = 1; i <= 50; i++) {
      list.push(this.getFake(i))
    }
    return {
      data: list,
    }
  }

  static getIcon(item) {
    return get(item, 'attributes.icon.icon')
  }
}
