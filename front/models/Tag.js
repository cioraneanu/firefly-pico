import BaseModel from '~/models/BaseModel'
import TagRepository from '~/repository/TagRepository'
import TagTransformer from '~/transformers/TagTransformer'
import Currency from '~/models/Currency.js'
import { get } from 'lodash-es'
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

  static getTotalFormatted(tag) {
    const amount = get(tag, 'attributes.total_amount')
    if (amount === null || amount === undefined) {
      return null
    }
    const currency = useCurrencyStore().currencyDictionary[get(tag, 'attributes.total_currency_id')]
    const decimals = Currency.getDecimalPlaces(currency) ?? 2
    const formattedAmount = parseFloat(amount).toFixed(decimals)
    const symbol = Currency.getSymbol(currency)
    return symbol ? `${formattedAmount} ${symbol}` : formattedAmount
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
