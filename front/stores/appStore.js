import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import ResponseUtils from '~/utils/ResponseUtils'
import { compareVersionStrings } from '~/utils/DataUtils'
import InfoRepository from '~/repository/InfoRepository.js'
import { get, keyBy } from 'lodash-es'
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

export const useAppStore = defineStore('app', () => {
  const defaultUrl = window.location.origin
  const runtimeConfig = useRuntimeConfig()

  const authToken = useLocalStorage('authToken', '')
  const picoBackendURL = useLocalStorage('picoBackendURL', defaultUrl)
  const syncProfileInDB = useLocalStorage('syncProfileInDB', true)
  const daysBetweenFullSync = useLocalStorage('daysBetweenFullSync', 4)

  const profileFloatButtonPosition = useLocalStorage('profileFloatButtonPosition', { y: window.innerHeight / 2.2 })

  const currentAppVersion = ref(runtimeConfig.public.version)
  const queryTimeout = ref(runtimeConfig.public.queryTimeout)
  const latestAppVersion = ref(null)

  const windowWidth = ref(null)

  const lastSync = useLocalStorage('lastSync', null, {
    serializer: {
      read: (v) => (v ? new Date(v) : null),
      write: (v) => (v ? v.toISOString() : null),
    },
  })
  const isSyncRequiredByMissingExtras = ref(false)

  // ---

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

  async function fetchLatestAppVersion() {
    let response = await new InfoRepository().getLatestVersion({ showLoading: false })
    if (!ResponseUtils.isSuccess(response)) {
      return
    }
    latestAppVersion.value = get(response, 'data')
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
    const profileStore = useProfileStore()

    await Promise.all([
      categoryStore.fetchCategories(),
      accountStore.fetchAccounts(),
      tagStore.fetchTags(),
      templateStore.fetchTransactionTemplates(),
      currencyStore.fetchCurrencies(),
      budgetStore.fetchBudgets(),
      piggyBankStore.fetchPiggyBanks(),
      currencyStore.fetchExchangeRate(),
      profileStore.getProfiles(),
    ])

    lastSync.value = new Date()
  }

  return {
    authToken,
    picoBackendURL,
    syncProfileInDB,
    daysBetweenFullSync,
    profileFloatButtonPosition,
    currentAppVersion,
    queryTimeout,
    latestAppVersion,
    windowWidth,
    activePage,
    isDesktopLayout,
    gridColumns,
    hasAuthToken,
    isNewVersionAvailable,
    fetchLatestAppVersion,
    lastSync,
    isSyncRequiredByMissingExtras,
    syncEverythingIfOld,
    syncEverything,
  }
})
