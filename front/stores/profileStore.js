import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import DateUtils from '~/utils/DateUtils'
import { cloneDeep, get, head, keyBy, omit } from 'lodash-es'
import { transactionFormFieldList, transactionListFieldList, transactionListHeroIcon } from '~/constants/TransactionConstants.js'
import { NUMBER_FORMAT } from '~/utils/NumberUtils.js'
import ProfileRepository from '~/repository/ProfileRepository'
import ProfileTransformer from '~/transformers/ProfileTransformer'
import { useAppStore } from '~/stores/appStore.js'
import { dashboardCardList } from '~/constants/DashboardConstants.js'
import Page from '~/models/Page.js'
import { migrateType, migrateTypeList } from '~/utils/MigrateUtils.js'

export const useProfileStore = defineStore('profile', () => {
  const profileActiveId = useLocalStorage('profileActiveId', null, { serializer: StorageSerializers.number })
  const profileList = useLocalStorage('profileList', [])

  // Actual fields which update when you change profiles
  const darkTheme = useLocalStorage('darkTheme', false)
  const language = useLocalStorage('language', 'en')
  const startingPage = useLocalStorage('startingPage', Page.types.transactionNew)
  const showAnimations = useLocalStorage('showAnimations', true)
  const resetFormOnCreate = useLocalStorage('resetFormOnCreate', false)

  const assistantTodoTagMatcher = useLocalStorage('assistantTodoTagMatcher', '!!')
  const assistantCurrency = useLocalStorage('assistantCurrency', null, { serializer: StorageSerializers.object })
  const autoFocusAssistant = useLocalStorage('autoFocusAssistant', false)

  const defaultAccountSource = useLocalStorage('defaultAccountSource', null, { serializer: StorageSerializers.object })
  const defaultAccountDestination = useLocalStorage('defaultAccountDestination', null, { serializer: StorageSerializers.object })
  const defaultCategory = useLocalStorage('defaultCategory', null, { serializer: StorageSerializers.object })
  const defaultForeignCurrency = useLocalStorage('defaultForeignCurrency', null, { serializer: StorageSerializers.object })
  const defaultTransactionTimeAtMidnight = useLocalStorage('defaultTransactionTimeAtMidnight', false)

  const defaultTags = useLocalStorage('defaultTags', [], { serializer: StorageSerializers.object })
  const autoAddedTags = useLocalStorage('autoAddedTags', [], { serializer: StorageSerializers.object })

  const transactionListDefaultFilterAccount = useLocalStorage('transactionListDefaultFilterAccount', null, { serializer: StorageSerializers.object })
  const transactionListDefaultFilterDateStart = useLocalStorage('transactionListDefaultFilterDateStart', null)
  const transactionListDefaultFilterDateEnd = useLocalStorage('transactionListDefaultFilterDateEnd', null)

  const isForeignCurrencyAlwaysVisible = useLocalStorage('isForeignCurrencyAlwaysVisible', false)

  const quickValueButtons = useLocalStorage('quickValueButtons', ['-10', '-1', '+1', '+10'])

  const transactionFormFieldsConfig = useLocalStorage('transactionFormFieldsConfig', transactionFormFieldList)
  const transactionListFieldsConfig = useLocalStorage('transactionListFieldsConfig', transactionListFieldList)
  const dashboardWidgetsConfig = useLocalStorage('dashboardWidgetsConfig', dashboardCardList)

  const dateFormat = useLocalStorage('dateFormat', DateUtils.FORMAT_ENGLISH_DATE)

  const copyCategoryToDescription = useLocalStorage('copyCategoryToDescription', false)
  const copyTagToDescription = useLocalStorage('copyTagToDescription', true)
  const copyTagToCategory = useLocalStorage('copyTagToCategory', true)

  const showTagSelectAsGrid = useLocalStorage('showTagSelectAsGrid', true)

  const numberFormat = useLocalStorage('numberFormat', NUMBER_FORMAT.eu)
  const weekStartsOn = useLocalStorage('weekStartsOn', 0)

  const lowerCaseTransactionDescription = useLocalStorage('lowerCaseTransactionDescription', false)
  const lowerCaseAccountName = useLocalStorage('lowerCaseAccountName', false)
  const lowerCaseCategoryName = useLocalStorage('lowerCaseCategoryName', true)
  const lowerCaseTagName = useLocalStorage('lowerCaseTagName', true)
  const stripAccents = useLocalStorage('stripAccents', true)

  const heroIcons = useLocalStorage('heroIcons', [transactionListHeroIcon.tags, transactionListHeroIcon.account])

  const budgetsEnabled = useLocalStorage('budgetsEnabled', true)
  const categoriesEnabled = useLocalStorage('categoriesEnabled', true)
  const tagsEnabled = useLocalStorage('tagsEnabled', true)
  const piggyBanksEnabled = useLocalStorage('piggyBanksEnabled', false)
  const recurringTransactionsEnabled = useLocalStorage('recurringTransactionsEnabled', true)

  const dashboard = reactive({
    firstDayOfMonth: useLocalStorage('firstDayOfMonth', 1),
    showAccountAmounts: useLocalStorage('showAccountAmounts', true),
    showDecimal: useLocalStorage('showDecimals', false),
    areEmptyAccountsVisible: useLocalStorage('areEmptyAccountsVisible', false),
    excludedAccountsList: useLocalStorage('excludedAccountsList', []),
    excludedCategoriesList: useLocalStorage('excludedCategoriesList', []),
    excludedTagsList: useLocalStorage('excludedTagsList', []),
  })

  // Getters
  const profileDictionary = computed(() => {
    return keyBy(profileList.value, 'id')
  })

  const activeProfile = computed(() => {
    return profileDictionary.value[profileActiveId.value]
  })

  const shortProfileName = computed(() => {
    if (!activeProfile.value || profileList.value.length <= 1) {
      return null
    }
    const profileName = (activeProfile.value?.name ?? '').toLowerCase()
    return profileName.substring(0, 3)
  })

  // Actions
  function setProfile(profile) {
    profileActiveId.value = profile ? parseInt(profile?.id) : null
    useProfileStore().$patch(profile?.settings ?? {})
  }

  function getProfileSettings() {
    let omitList = ['dashboard.showAccountAmounts', 'profileActiveId', 'profileList']
    let data = cloneDeep(useProfileStore().$state)
    let profile = profileList.value.find((item) => item.id === profileActiveId.value)

    return {
      id: profileActiveId.value,
      name: profile?.name,
      settings: {
        ...omit(data, omitList),
      },
    }
  }

  async function getProfiles({ showLoading = true } = {}) {
    const appStore = useAppStore()
    if (!appStore.syncProfileInDB) {
      return
    }

    const response = await new ProfileRepository().getAll({ showLoading })
    let responseData = response.data ?? []
    profileList.value = responseData

    if (responseData.length > 0) {
      let activeProfileObj = profileActiveId.value ? responseData.find((item) => item.id === profileActiveId.value) : null
      activeProfileObj = activeProfileObj ?? head(responseData)
      setProfile(activeProfileObj)
    }

    migrateProfile()
  }

  async function writeProfile() {
    const appStore = useAppStore()
    if (!appStore.syncProfileInDB) {
      return
    }

    let data = getProfileSettings()
    let requestData = ProfileTransformer.transformToApi(data)
    let response = await new ProfileRepository().update(data.id, requestData)
    if (ResponseUtils.isSuccess(response)) {
      let profileResponse = get(response, 'data.data')
      profileList.value = profileList.value.map((item) => (item.id === profileResponse.id ? profileResponse : item))
    }

    return response
  }

  function migrateProfile() {
    // If we add new fields for "transactionFormFieldsConfig" / "dashboardWidgetsConfig"
    // which the user doesn't have in localStorage add them as well
    const store = useProfileStore()
    store.transactionFormFieldsConfig = migrateTypeList(store.transactionFormFieldsConfig, transactionFormFieldList)
    store.transactionListFieldsConfig = migrateTypeList(store.transactionListFieldsConfig, transactionListFieldList)
    store.dashboardWidgetsConfig = migrateTypeList(store.dashboardWidgetsConfig, dashboardCardList)

    // If we changed the content of fixed lists update user settings
    startingPage.value = migrateType(startingPage.value, Page.typesList())
  }

  return {
    profileActiveId,
    profileList,
    darkTheme,
    language,
    startingPage,
    showAnimations,
    resetFormOnCreate,
    assistantTodoTagMatcher,
    assistantCurrency,
    autoFocusAssistant,
    defaultAccountSource,
    defaultAccountDestination,
    defaultCategory,
    defaultForeignCurrency,
    defaultTransactionTimeAtMidnight,
    defaultTags,
    autoAddedTags,
    transactionListDefaultFilterAccount,
    transactionListDefaultFilterDateStart,
    transactionListDefaultFilterDateEnd,
    isForeignCurrencyAlwaysVisible,
    quickValueButtons,
    transactionFormFieldsConfig,
    transactionListFieldsConfig,
    dashboardWidgetsConfig,
    dateFormat,
    copyCategoryToDescription,
    copyTagToDescription,
    copyTagToCategory,
    showTagSelectAsGrid,
    numberFormat,
    weekStartsOn,
    lowerCaseTransactionDescription,
    lowerCaseAccountName,
    lowerCaseCategoryName,
    lowerCaseTagName,
    stripAccents,
    heroIcons,
    budgetsEnabled,
    categoriesEnabled,
    tagsEnabled,
    piggyBanksEnabled,
    recurringTransactionsEnabled,
    dashboard,
    profileDictionary,
    activeProfile,
    shortProfileName,
    setProfile,
    getProfileSettings,
    getProfiles,
    writeProfile,
    migrateProfile,
  }
})
