import { defineStore } from 'pinia'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import * as LanguageConstants from '~/constants/LanguageConstants'
import DateUtils from '~/utils/DateUtils'
import { FORM_CONSTANTS_TRANSACTION_FIELDS_LIST } from '~/constants/FormConstants'
import ResponseUtils from '~/utils/ResponseUtils'
import { compareVersionStrings } from '~/utils/DataUtils'
import InfoRepository from '~/repository/InfoRepository.js'
import { get } from 'lodash'
import { HERO_ICONS, HERO_ICONS_LIST } from '~/constants/TransactionConstants.js'
import { NUMBER_FORMAT } from '~/utils/MathUtils.js'
import ProfileRepository from '~/repository/ProfileRepository'
import ProfileTransformer from '~/transformers/ProfileTransformer'


export const useAppStore = defineStore('app', {
  state: () => {
    const defaultUrl = window.location.origin
    const runtimeConfig = useRuntimeConfig()

    return {
      authToken: useLocalStorage('authToken', ''),
      picoBackendURL: useLocalStorage('picoBackendURL', defaultUrl),

      currentAppVersion: runtimeConfig.public.version,
      queryTimeout: runtimeConfig.public.queryTimeout,
      latestAppVersion: null,
    }
  },

  getters: {
    hasAuthToken(state) {
      return state.authToken && state.authToken.length > 0
    },
    isNewVersionAvailable(state) {
      if (!state.latestAppVersion) {
        return false
      }
      return compareVersionStrings(state.latestAppVersion, state.currentAppVersion) > 0
    },
  },

  actions: {
    async fetchLatestAppVersion() {
      let response = await new InfoRepository().getLatestVersion()
      if (!ResponseUtils.isSuccess(response)) {
        return
      }
      this.latestAppVersion = get(response, 'data')
    }
  },
})
