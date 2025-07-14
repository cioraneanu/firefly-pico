import ApiTransformer from '~/transformers/ApiTransformer'

export default class ProfileTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    return item
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    return item
  }
}
