import { defineStore } from 'pinia'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import * as LanguageConstants from '~/constants/LanguageConstants'
import DateUtils from '~/utils/DateUtils'
import { cloneDeep, get, head, keyBy, omit } from 'lodash'
import { transactionFormFieldList, transactionListFieldList, transactionListHeroIcon, transactionListHeroIconList } from '~/constants/TransactionConstants.js'
import { NUMBER_FORMAT } from '~/utils/NumberUtils.js'
import ProfileRepository from '~/repository/ProfileRepository'
import ProfileTransformer from '~/transformers/ProfileTransformer'
import { useAppStore } from '~/stores/appStore.js'
import { dashboardCardList } from '~/constants/DashboardConstants.js'
import Page from '~/models/Page.js'
import { migrateType } from '~/utils/MigrateUtils.js'

export const useProfileStore = defineStore('profile', {
  state: () => {
    return {
      isLoading: false,
      loadingMessage: 'Loading...',

      profileActiveId: useLocalStorage('profileActiveId', null, { serializer: StorageSerializers.number }),
      profileList: useLocalStorage('profileList', []),

      // Actual fields which update when you change profiles
      darkTheme: useLocalStorage('darkTheme', false),
      language: useLocalStorage('language', 'en'),
      startingPage: useLocalStorage('startingPage', Page.types.transactionNew),
      showAnimations: useLocalStorage('showAnimations', true),
      resetFormOnCreate: useLocalStorage('resetFormOnCreate', false),

      assistantTodoTagMatcher: useLocalStorage('assistantTodoTagMatcher', '!!'),
      assistantCurrency: useLocalStorage('assistantCurrency', null, { serializer: StorageSerializers.object }),

      defaultAccountSource: useLocalStorage('defaultAccountSource', null, { serializer: StorageSerializers.object }),
      defaultAccountDestination: useLocalStorage('defaultAccountDestination', null, { serializer: StorageSerializers.object }),
      defaultCategory: useLocalStorage('defaultCategory', null, { serializer: StorageSerializers.object }),
      defaultForeignCurrency: useLocalStorage('defaultForeignCurrency', null, { serializer: StorageSerializers.object }),

      defaultTags: useLocalStorage('defaultTags', [], { serializer: StorageSerializers.object }),
      autoAddedTags: useLocalStorage('autoAddedTags', [], { serializer: StorageSerializers.object }),

      transactionListDefaultFilterAccount: useLocalStorage('transactionListDefaultFilterAccount', null, { serializer: StorageSerializers.object }),
      transactionListDefaultFilterDateStart: useLocalStorage('transactionListDefaultFilterDateStart', null),
      transactionListDefaultFilterDateEnd: useLocalStorage('transactionListDefaultFilterDateEnd', null),

      isForeignCurrencyAlwaysVisible: useLocalStorage('isForeignCurrencyAlwaysVisible', false),

      quickValueButtons: useLocalStorage('quickValueButtons', ['-10', '-1', '+1', '+10']),

      transactionFormFieldsConfig: useLocalStorage('transactionFormFieldsConfig', transactionFormFieldList),
      transactionListFieldsConfig: useLocalStorage('transactionListFieldsConfig', transactionListFieldList),
      dashboardWidgetsConfig: useLocalStorage('dashboardWidgetsConfig', dashboardCardList),

      dateFormat: useLocalStorage('dateFormat', DateUtils.FORMAT_ENGLISH_DATE),

      copyCategoryToDescription: useLocalStorage('copyCategoryToDescription', false),
      copyTagToDescription: useLocalStorage('copyTagToDescription', true),
      copyTagToCategory: useLocalStorage('copyTagToCategory', true),

      showTagSelectAsGrid: useLocalStorage('showTagSelectAsGrid', true),

      numberFormat: useLocalStorage('numberFormat', NUMBER_FORMAT.eu),
      weekStartsOn: useLocalStorage('weekStartsOn', 0),

      lowerCaseTransactionDescription: useLocalStorage('lowerCaseTransactionDescription', false),
      lowerCaseAccountName: useLocalStorage('lowerCaseAccountName', false),
      lowerCaseCategoryName: useLocalStorage('lowerCaseCategoryName', true),
      lowerCaseTagName: useLocalStorage('lowerCaseTagName', true),
      stripAccents: useLocalStorage('stripAccents', true),

      heroIcons: useLocalStorage('heroIcons', [transactionListHeroIcon.tags, transactionListHeroIcon.account]),

      dashboard: {
        firstDayOfMonth: useLocalStorage('firstDayOfMonth', 1),
        showAccountAmounts: useLocalStorage('showAccountAmounts', true),
        showDecimal: useLocalStorage('showDecimals', false),
        areEmptyAccountsVisible: useLocalStorage('areEmptyAccountsVisible', false),
        excludedAccountsList: useLocalStorage('excludedAccountsList', []),
        excludedCategoriesList: useLocalStorage('excludedCategoriesList', []),
        excludedTagsList: useLocalStorage('excludedTagsList', []),
      },
    }
  },

  getters: {
    profileDictionary(state) {
      return keyBy(state.profileList, 'id')
    },

    activeProfile(state) {
      return this.profileDictionary[state.profileActiveId]
    },

    shortProfileName(state) {
      // If single profile or no list, show nothing
      if (!this.activeProfile || state.profileList.length <= 1) {
        return null
      }

      const profileName = this.activeProfile.name.toLowerCase()
      const otherProfileNames = state.profileList.filter((p) => p.id != state.profileActiveId).map((p) => (p.name || '').toLowerCase())

      // Find shortest unique prefix
      for (let i = 1; i <= profileName.length; i++) {
        const prefix = profileName.substring(0, i)
        const prefixLower = prefix.toLowerCase()

        // Check uniqueness case-insensitive
        const isConflict = otherProfileNames.some((name) => name.startsWith(prefixLower))

        if (!isConflict) {
          return prefix
        }
      }

      return profileName
    },
  },

  actions: {
    setProfile(profile) {
      this.profileActiveId = profile ? parseInt(profile?.id) : null
      this.$patch(profile?.settings ?? {})
    },

    getProfileSettings() {
      let omitList = ['isLoading', 'loadingMessage', 'dashboard.showAccountAmounts', 'profileActiveId', 'profileList']
      let data = cloneDeep(this.$state)
      let profile = this.profileList.find((item) => item.id === this.profileActiveId)

      return {
        id: this.profileActiveId,
        name: profile?.name,
        settings: {
          ...omit(data, omitList),
        },
      }
    },

    async getProfiles() {
      const appStore = useAppStore()
      if (!appStore.syncProfileInDB) {
        return
      }
      this.isLoading = true

      const response = await new ProfileRepository().getAll()
      let responseData = response.data ?? []
      this.profileList = responseData

      if (responseData.length > 0) {
        let activeProfile = this.profileActiveId ? responseData.find((item) => item.id === this.profileActiveId) : null
        activeProfile = activeProfile ?? head(responseData)
        this.setProfile(activeProfile)
      }

      this.isLoading = false
      this.migrateProfile()
    },

    async writeProfile() {
      const appStore = useAppStore()
      if (!appStore.syncProfileInDB) {
        return
      }
      this.isLoading = true

      let data = this.getProfileSettings()
      let requestData = ProfileTransformer.transformToApi(data)
      let response = await new ProfileRepository().update(data.id, requestData)
      if (ResponseUtils.isSuccess(response)) {
        let profileResponse = get(response, 'data.data')
        this.profileList = this.profileList.map((item) => (item.id === profileResponse.id ? profileResponse : item))
      }

      this.isLoading = false
      return response
    },

    // TODO: These could probably be removed later because all users would have transitioned to the new structure
    migrateProfile() {
      // If we add new fields for "transactionFormFieldsConfig" / "dashboardWidgetsConfig"
      // which the user doesn't have in localStorage add them as well
      const profileStore = useProfileStore()
      profileStore.transactionFormFieldsConfig = migrateTypeList(profileStore.transactionFormFieldsConfig, transactionFormFieldList)
      profileStore.transactionListFieldsConfig = migrateTypeList(profileStore.transactionListFieldsConfig, transactionListFieldList)
      profileStore.dashboardWidgetsConfig = migrateTypeList(profileStore.dashboardWidgetsConfig, dashboardCardList)
      // profileStore.heroIcons = migrateTypeList(profileStore.heroIcons, transactionListHeroIconList)

      // If we changed the content of fixed lists update user settings (ex we removed "name" and added "t" to support translations)
      this.startingPage = migrateType(this.startingPage, Page.typesList())
    },
  },
})
