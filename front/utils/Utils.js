import _ from 'lodash'

export default class UIUtils {

  static updateListWithNewItems(list, newItems) {
    newItems = _.isArray(newItems) ? newItems : [newItems]
    let newItemIds = newItems.map((item) => item.id)
    let initialListFiltered = list.filter((item) => !newItemIds.includes(item.id))
    return [...newItems, ...initialListFiltered]
  }

  static stringToData(item, path, list) {
    const type = _.get(item, path)
    const convertedType = list.find((accountType) => accountType.code === type)
    _.set(item, path, convertedType)
  }
}

export function ellipsizeText(text = '', maxLength = 100) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

export function getGUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16))
}
