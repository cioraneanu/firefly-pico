import BaseModel from '~/models/BaseModel'
import ProfileTransformer from '~/transformers/ProfileTransformer'
import ProfileRepository from '~/repository/ProfileRepository'

class Profile extends BaseModel {
  getTransformer() {
    return ProfileTransformer
  }

  getRepository() {
    return new ProfileRepository()
  }

  getEmpty() {
    return {
      name: '',
      settings: useProfileStore().getProfileSettings(),
    }
  }

  // ------------

  getFake() {
    return {}
  }
}

export default Profile
