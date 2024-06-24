import ApiTransformer from '~/transformers/ApiTransformer'

export default class AppSettingsTransformer extends ApiTransformer {
  static transformFromApi(item) {
    if (!item) {
      return null
    }

    return JSON.parse(item.settings)
  }

  static transformToApi(item) {
    if (!item) {
      return null
    }

    return {
      settings: item,
    }
  }
}
