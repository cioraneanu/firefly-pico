import BaseModel from '~/models/BaseModel'
import ProfileTransformer from '~/transformers/ProfileTransformer'
import ProfileRepository from '~/repository/ProfileRepository'

export default class Profile extends BaseModel {
  getTransformer() {
    return ProfileTransformer
  }

  getRepository() {
    return new ProfileRepository()
  }

  getEmpty() {
    return {
      ...useProfileStore().getProfileSettings(),
      id: null,
      name: '',
    }
  }

  // ------------

  getFake() {
    return {}
  }
}
