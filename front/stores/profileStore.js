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
import { useAppStore } from '~/stores/appStore.js'


export const useProfileStore = defineStore('profile', {
  state: () => {
    const defaultUrl = window.location.origin
    const runtimeConfig = useRuntimeConfig()

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

  getters: {

  },

  actions: {

    async fetchProfile() {
      const response = await new ProfileRepository().getProfile()

      if (response.data == null) {
        return
      }

      const newValues = ProfileTransformer.transformFromApi(response.data)

      // for (let key of PERSISTED_FIELDS.values()) {
      //   if (!(key in newValues)) {
      //     continue
      //   }
      //   if (NESTED_FIELDS.has(key)) {
      //     for (let nestedKey of Object.keys(newValues[key])) {
      //       this.$state[key][nestedKey] = newValues[key][nestedKey]
      //     }
      //   } else {
      //     this.$state[key] = newValues[key]
      //   }
      // }
    },

    async writeProfile() {
      const data = {}
      // for (let key of PERSISTED_FIELDS.values()) {
      //   if (NESTED_FIELDS.has(key)) {
      //     data[key] = {}
      //     for (let nestedKey of Object.keys(this.$state[key])) {
      //       data[key][nestedKey] = this.$state[key][nestedKey]
      //     }
      //   } else {
      //     data[key] = this.$state[key]
      //   }
      // }
      await new ProfileRepository().writeProfile(ProfileTransformer.transformToApi(data))
    },
  },
})
