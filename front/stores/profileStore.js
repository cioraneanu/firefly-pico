import { defineStore } from 'pinia'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import * as LanguageConstants from '~/constants/LanguageConstants'
import DateUtils from '~/utils/DateUtils'
import { cloneDeep, get, head, omit } from 'lodash'
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

      profileActiveId: useLocalStorage('profileActiveId', null),
      profileList: useLocalStorage('profileList', []),

      // Actual fields which update when you change profiles
      darkTheme: useLocalStorage('darkTheme', false),
      language: useLocalStorage('language', 'en'),
      startingPage: useLocalStorage('startingPage', Page.types.transactionNew),
      showAnimations: useLocalStorage('showAnimations', true),
      resetFormOnCreate: useLocalStorage('resetFormOnCreate', false),

      assistantTodoTagMatcher: useLocalStorage('assistantTodoTagMatcher', '!!'),

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

  getters: {},

  actions: {
    setProfile(profile) {
      if (!profile) {
        return
      }

      console.log('change profile', {oldValue: cloneDeep(this.language), newValue: cloneDeep(profile)})
      this.profileActiveId = profile.id
      this.$patch(profile.settings ?? {})
    },

    getProfileSettings() {
      let omitList = ['isLoading', 'loadingMessage', 'dashboard.showAccountAmounts', 'profileActiveId', 'profileList', 'profileActiveId']
      let data = cloneDeep(this.$state)
      return {
        ...omit(data, omitList),
        id: this.profileActiveId
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
      let activeProfile = this.profileActiveId ? responseData.find((item) => item.id === this.profileActiveId) : null
      activeProfile = activeProfile ?? head(responseData)
      this.setProfile(activeProfile)

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
      let respose = await new ProfileRepository().update(data.id, requestData)
      this.isLoading = false
    },

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
