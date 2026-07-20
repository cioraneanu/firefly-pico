import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import ResponseUtils from '~/utils/ResponseUtils'
import { compareVersionStrings } from '~/utils/DataUtils'
import InfoRepository from '~/repository/InfoRepository.js'
import { get } from 'lodash-es'
import RouteConstants from '~/constants/RouteConstants.js'
import { useProfileStore } from '~/stores/profileStore.js'
import { differenceInDays, subDays } from 'date-fns'
import { useCategoryStore } from '~/stores/categoryStore.js'
import { useAccountStore } from '~/stores/accountStore.js'
import { useTagStore } from '~/stores/tagStore.js'
import { useTemplateStore } from '~/stores/templateStore.js'
import { useCurrencyStore } from '~/stores/currencyStore.js'
import { useBudgetStore } from '~/stores/budgetStore.js'
import { usePiggyBankStore } from '~/stores/piggyBankStore.js'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore.js'
import DateUtils from '~/utils/DateUtils.js'

export const useAppStore = defineStore('app', () => {
  const defaultUrl = window.location.origin
  const runtimeConfig = useRuntimeConfig()

  const authToken = useLocalStorage('authToken', '')
  const picoBackendURL = useLocalStorage('picoBackendURL', defaultUrl)
  const picoBackendHeaders = useLocalStorage('picoBackendHeaders', [])
  const syncProfileInDB = useLocalStorage('syncProfileInDB', true)
  const daysBetweenFullSync = useLocalStorage('daysBetweenFullSync', 4)

  const profileFloatButtonPosition = useLocalStorage('profileFloatButtonPosition', { y: window.innerHeight / 2.2 })

  const currentAppVersion = ref(runtimeConfig.public.version)
  const queryTimeout = ref(runtimeConfig.public.queryTimeout)

  // General info from backend, { latest_version, use_llm, etc }
  const info = useLocalStorage('info', null, { serializer: StorageSerializers.object })

  const windowWidth = ref(null)

  const lastSync = useLocalStorage('lastSync', null, DateUtils.storageSerializer)
  const isSyncRequiredByMissingExtras = ref(false)

  // ---

  const latestAppVersion = computed(() => get(info.value, 'latest_version'))
  const llm = computed(() => get(info.value, 'assistant_llm'))
  const llmIsConfigured = computed(() => get(llm.value, 'is_configured'))
  const llmModel = computed(() => get(llm.value, 'model'))
  const llmEndpoint = computed(() => get(llm.value, 'endpoint'))
  const transcription = computed(() => get(info.value, 'assistant_transcription'))
  const transcriptionIsConfigured = computed(() => get(transcription.value, 'is_configured'))
  const transcriptionModel = computed(() => get(transcription.value, 'model'))
  const transcriptionEndpoint = computed(() => get(transcription.value, 'endpoint'))

  const activePage = computed(() => {
    const route = useRoute()
    const routeMapping = {
      [RouteConstants.ROUTE_DASHBOARD]: [RouteConstants.ROUTE_DASHBOARD],
      [RouteConstants.ROUTE_TRANSACTION_LIST]: [RouteConstants.ROUTE_TRANSACTION_LIST],
      [RouteConstants.ROUTE_EXTRAS]: [
        RouteConstants.ROUTE_EXTRAS,
        RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
        RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID,
        RouteConstants.ROUTE_ACCOUNT_LIST,
        RouteConstants.ROUTE_ACCOUNT_ID,
        RouteConstants.ROUTE_TAG_LIST,
        RouteConstants.ROUTE_TAG_ID,
      ],
      [RouteConstants.ROUTE_SETTINGS]: [RouteConstants.ROUTE_SETTINGS, RouteConstants.ROUTE_SETTINGS_SETUP, RouteConstants.ROUTE_SETTINGS_ABOUT, RouteConstants.ROUTE_SETTINGS_UI],
    }

    return Object.entries(routeMapping).find(([, routes]) => routes.includes(route.path))?.[0]
  })

  const isDesktopLayout = computed(() => {
    return (windowWidth.value ?? 0) > 800 && useDevice().isDesktop
  })

  const gridColumns = computed(() => {
    if (isDesktopLayout.value) {
      return Math.floor(windowWidth.value / 200)
    }
    return 3
  })

  const hasAuthToken = computed(() => {
    return authToken.value && authToken.value.length > 0
  })

  const isNewVersionAvailable = computed(() => {
    if (!latestAppVersion.value) {
      return false
    }
    return compareVersionStrings(latestAppVersion.value, currentAppVersion.value) > 0
  })

  // -------

  async function fetchInfo() {
    let response = await new InfoRepository().getInfo({ showLoading: false })
    if (!ResponseUtils.isSuccess(response)) {
      return
    }
    info.value = response?.data
  }

  async function syncEverythingIfOld() {
    let lastSyncTime = lastSync.value ?? subDays(new Date(), 365)
    let now = new Date()
    const appStore = useAppStore()

    if (differenceInDays(now, lastSyncTime) < appStore.daysBetweenFullSync) {
      return
    }

    await syncEverything()
  }

  async function syncEverything() {
    const appStore = useAppStore()
    if (!appStore.hasAuthToken) return

    const categoryStore = useCategoryStore()
    const accountStore = useAccountStore()
    const tagStore = useTagStore()
    const templateStore = useTemplateStore()
    const currencyStore = useCurrencyStore()
    const budgetStore = useBudgetStore()
    const piggyBankStore = usePiggyBankStore()
    const recurringTransactionStore = useRecurringTransactionStore()
    const profileStore = useProfileStore()

    await Promise.all([
      categoryStore.fetchCategories(),
      accountStore.fetchAccounts(),
      tagStore.fetchTags(),
      templateStore.fetchTransactionTemplates(),
      currencyStore.fetchCurrencies(),
      budgetStore.fetchBudgets(),
      piggyBankStore.fetchPiggyBanks(),
      recurringTransactionStore.fetchRecurringTransactions(),
      currencyStore.fetchExchangeRate(),
      profileStore.getProfiles(),
    ])

    lastSync.value = new Date()
  }

  return {
    authToken,
    picoBackendURL,
    picoBackendHeaders,
    syncProfileInDB,
    daysBetweenFullSync,

    profileFloatButtonPosition,
    currentAppVersion,
    queryTimeout,
    latestAppVersion,

    llm,
    llmIsConfigured,
    llmModel,
    llmEndpoint,

    transcription,
    transcriptionIsConfigured,
    transcriptionModel,
    transcriptionEndpoint,

    windowWidth,
    activePage,
    isDesktopLayout,
    gridColumns,
    hasAuthToken,
    isNewVersionAvailable,
    fetchInfo,
    lastSync,
    isSyncRequiredByMissingExtras,
    syncEverythingIfOld,
    syncEverything,
  }
})
