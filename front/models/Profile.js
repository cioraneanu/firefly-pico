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
    return {}
  }

  // ------------

  getFake() {
    return {}
  }
}

export default Profile
