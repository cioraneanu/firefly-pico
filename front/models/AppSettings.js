import BaseModel from '~/models/BaseModel'
import AppSettingsTransformer from '~/transformers/AppSettingsTransformer'
import AppSettingsRepository from '~/repository/AppSettingsRepository'

class UISettings extends BaseModel {
  getTransformer() {
    return AppSettingsTransformer
  }

  getRepository() {
    return new AppSettingsRepository()
  }

  getEmpty() {
    return {}
  }

  // ------------

  getFake() {
    return {}
  }
}

export default UISettings
