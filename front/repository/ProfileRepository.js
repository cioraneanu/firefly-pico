import axios from 'axios'
import BaseRepository from '~/repository/BaseRepository'
import _ from 'lodash'

export default class ProfileRepository extends BaseRepository {
  constructor() {
    super('api/profiles')
  }
}

