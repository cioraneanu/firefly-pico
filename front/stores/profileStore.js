import { defineStore } from 'pinia'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import * as LanguageConstants from '~/constants/LanguageConstants'
import DateUtils from '~/utils/DateUtils'
import { FORM_CONSTANTS_TRANSACTION_FIELDS_LIST } from '~/constants/FormConstants'
import ResponseUtils from '~/utils/ResponseUtils'
import { compareVersionStrings } from '~/utils/DataUtils'
import InfoRepository from '~/repository/InfoRepository.js'
import { cloneDeep, get, omit } from 'lodash'
import { HERO_ICONS, HERO_ICONS_LIST } from '~/constants/TransactionConstants.js'
import { NUMBER_FORMAT } from '~/utils/MathUtils.js'
import ProfileRepository from '~/repository/ProfileRepository'
import ProfileTransformer from '~/transformers/ProfileTransformer'
import { useAppStore } from '~/stores/appStore.js'

export const useProfileStore = defineStore('profile', {
  state: () => {
    return {
      isLoading: false,

      darkTheme: useLocalStorage('darkTheme', false),

      defaultAccountSource: useLocalStorage('defaultAccountSource', null, { serializer: StorageSerializers.object }),
      defaultAccountDestination: useLocalStorage('defaultAccountDestination', null, { serializer: StorageSerializers.object }),
      defaultCategory: useLocalStorage('defaultCategory', null, { serializer: StorageSerializers.object }),

      defaultTags: useLocalStorage('defaultTags', [], { serializer: StorageSerializers.object }),
      autoAddedTags: useLocalStorage('autoAddedTags', [], { serializer: StorageSerializers.object }),

      quickValueButtons: useLocalStorage('quickValueButtons', ['-10', '-1', '+1', '+10']),
      transactionOrderedFieldsList: useLocalStorage('transactionOrderedFieldsList', FORM_CONSTANTS_TRANSACTION_FIELDS_LIST),

      dateFormat: useLocalStorage('dateFormat', DateUtils.FORMAT_ENGLISH_DATE),

      copyCategoryToDescription: useLocalStorage('copyCategoryToDescription', false),
      copyTagToDescription: useLocalStorage('copyTagToDescription', true),
      copyTagToCategory: useLocalStorage('copyTagToCategory', true),

      showTagSelectAsGrid: useLocalStorage('showTagSelectAsGrid', true),

      numberFormat: useLocalStorage('numberFormat', NUMBER_FORMAT.eu),
      lowerCaseTransactionDescription: useLocalStorage('lowerCaseTransactionDescription', false),
      lowerCaseAccountName: useLocalStorage('lowerCaseAccountName', false),
      lowerCaseCategoryName: useLocalStorage('lowerCaseCategoryName', true),
      lowerCaseTagName: useLocalStorage('lowerCaseTagName', true),

      heroIcons: useLocalStorage(
        'heroIcons',
        HERO_ICONS_LIST.filter((item) => [HERO_ICONS.tag, HERO_ICONS.account].includes(item.code)),
      ),

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
    async fetchProfile() {
      const appStore = useAppStore()
      if (!appStore.syncProfileInDB) {
        return
      }
      this.isLoading = true
      const response = await new ProfileRepository().getProfile()
      let responseData = response.data ?? {}
      responseData = ProfileTransformer.transformFromApi(responseData)
      this.$patch(responseData)
      this.isLoading = false
    },

    async writeProfile() {
      const appStore = useAppStore()
      if (!appStore.syncProfileInDB) {
        return
      }

      this.isLoading = true
      let data = cloneDeep(this.$state)
      data = omit(data, 'dashboard.showAccountAmounts')
      await new ProfileRepository().writeProfile(ProfileTransformer.transformToApi(data))
      this.isLoading = false
    },
  },
})
