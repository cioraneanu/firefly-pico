import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import ResponseUtils from '~/utils/ResponseUtils'
import { compareVersionStrings } from '~/utils/DataUtils'
import InfoRepository from '~/repository/InfoRepository.js'
import { get } from 'lodash'

export const useAppStore = defineStore('app', {
  state: () => {
    const defaultUrl = window.location.origin
    const runtimeConfig = useRuntimeConfig()

    return {
      authToken: useLocalStorage('authToken', ''),
      picoBackendURL: useLocalStorage('picoBackendURL', defaultUrl),
      syncProfileInDB: useLocalStorage('syncProfileInDB', true),
      daysBetweenFullSync: useLocalStorage('daysBetweenFullSync', 4),

      profileFloatButtonPosition: useLocalStorage('profileFloatButtonPosition', { y: window.innerHeight / 2.2 }),


      currentAppVersion: runtimeConfig.public.version,
      queryTimeout: runtimeConfig.public.queryTimeout,
      latestAppVersion: null,

      windowWidth: null
    }
  },

  getters: {
    isDesktopLayout(state) {
      return (state.windowWidth ?? 0) > 800 && useDevice().isDesktop
    },

    gridColumns(state) {
      if (this.isDesktopLayout) {
        return Math.floor(state.windowWidth / 200)
      }
      return 3
    },

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
    },
  },
})
