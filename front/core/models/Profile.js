import BaseModel from '~/core/models/BaseModel'
import ProfileTransformer from '~/core/transformers/ProfileTransformer'
import ProfileRepository from '~/core/repository/ProfileRepository'

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
