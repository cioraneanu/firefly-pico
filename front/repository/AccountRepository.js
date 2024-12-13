import BaseRepository from '~/repository/BaseRepository'
import axios from 'axios'
import _ from 'lodash'
import { useProfileStore } from '~/stores/profileStore'
import { useDataStore } from '~/stores/dataStore'

class AccountRepository extends BaseRepository {
  constructor() {
    super('api/accounts')
  }
}

export default AccountRepository
