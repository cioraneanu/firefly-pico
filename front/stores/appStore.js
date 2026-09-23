import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import ResponseUtils from '~/utils/ResponseUtils'
import { compareVersionStrings } from '~/utils/DataUtils'
import InfoRepository from '~/repository/InfoRepository.js'
import { get } from 'lodash-es'
import RouteConstants from '~/constants/RouteConstants.js'
import SyncRepository from '~/repository/SyncRepository.js'
import { useProfileStore } from '~/stores/profileStore.js'
import { useDashboardStore } from '~/stores/dashboardStore.js'
import { differenceInDays, differenceInSeconds, endOfMonth, startOfMonth, startOfTomorrow, subDays } from 'date-fns'
import { useCategoryStore } from '~/stores/categoryStore.js'
import { useAccountStore } from '~/stores/accountStore.js'
import { useTagStore } from '~/stores/tagStore.js'
import { useTemplateStore } from '~/stores/templateStore.js'
import { useCurrencyStore } from '~/stores/currencyStore.js'
import { useBudgetStore } from '~/stores/budgetStore.js'
import { usePiggyBankStore } from '~/stores/piggyBankStore.js'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore.js'
import DateUtils from '~/utils/DateUtils.js'

// How often the app is allowed to ask the backend whether anything changed.
const SECONDS_BETWEEN_SYNC_CHECKS = 60

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
  const lastSyncCheck = useLocalStorage('lastSyncCheck', null, DateUtils.storageSerializer)
  // Hash of the payload our local stores were built from. Sent back on every sync so the
  // backend can answer "nothing changed" instead of resending everything.
  const syncHash = useLocalStorage('syncHash', null)
  const isSyncing = ref(false)
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
  const transcriptionLanguage = computed(() => get(transcription.value, 'language'))

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

    // The profile has just been loaded on app start, so there is nothing to re-read.
    await syncEverything({ syncProfiles: false })
  }

  /**
   * Firefly III offers nothing to sync incrementally with - no "changed since" filter, no
   * sort on updated_at and no ETags - so the only way to notice an edit made in Firefly, the
   * importer or a rule is to ask again. The backend answers an unchanged sync with just a
   * hash, which makes asking cheap enough to do whenever the app comes back to the front.
   */
  async function syncEverythingIfStale() {
    const appStore = useAppStore()
    if (!appStore.hasAuthToken || isSyncing.value) return

    let lastCheck = lastSyncCheck.value
    if (lastCheck && differenceInSeconds(new Date(), lastCheck) < SECONDS_BETWEEN_SYNC_CHECKS) {
      return
    }

    // Never re-read the profile here: this runs whenever the app is brought back to the
    // front, and reloading it would throw away settings the user is in the middle of editing.
    await syncEverything({ showLoading: false, syncProfiles: false })
  }

  /**
   * @param force          Ask for a freshly fetched full payload, bypassing both our hash and the
   *                       backend cache. Used by the manual sync buttons, where the point is to
   *                       rebuild the stores.
   * @param syncProfiles   Re-read the profile first. Which resources are enabled lives there,
   *                       so it has to be known before we can say what to sync.
   */
  async function syncEverything({ force = false, showLoading = true, syncProfiles = true } = {}) {
    const appStore = useAppStore()
    if (!appStore.hasAuthToken) return

    if (syncProfiles) {
      await useProfileStore().getProfiles({ showLoading })
    }

    isSyncing.value = true

    try {
      const response = await new SyncRepository().sync({
        entities: getSyncEntities(),
        params: getSyncParams(),
        hash: force ? null : syncHash.value,
        force,
        showLoading,
      })

      // Failed: leave the stores alone, and let the next focus try again.
      if (!get(response, 'hash')) {
        return
      }
      lastSyncCheck.value = new Date()

      // Nothing changed. Rewriting the stores would only churn storage and re-trigger every
      // computed that reads them, in every open tab.
      if (get(response, 'unchanged')) {
        lastSync.value = new Date()
        return
      }

      applySync(get(response, 'data', {}))
      syncHash.value = get(response, 'hash')
      lastSync.value = new Date()
      isSyncRequiredByMissingExtras.value = false
    } finally {
      isSyncing.value = false
    }
  }

  function getSyncEntities() {
    const profileStore = useProfileStore()

    return [
      'accounts',
      'currencies',
      'exchange-rates',
      'transaction-templates',
      profileStore.categoriesEnabled ? 'categories' : null,
      profileStore.tagsEnabled ? 'tags' : null,
      profileStore.budgetsEnabled ? 'budgets' : null,
      profileStore.budgetsEnabled ? 'budget-limits' : null,
      profileStore.piggyBanksEnabled ? 'piggy-banks' : null,
      profileStore.recurringTransactionsEnabled ? 'recurrences' : null,
    ].filter((item) => item)
  }

  function getSyncParams() {
    const dashboardStore = useDashboardStore()

    return {
      date: DateUtils.dateToString(startOfTomorrow()),
      start: DateUtils.dateToString(dashboardStore.dashboardDateStart ?? startOfMonth(new Date())),
      end: DateUtils.dateToString(dashboardStore.dashboardDateEnd ?? endOfMonth(new Date())),
    }
  }

  function applySync(data) {
    // Currencies go first: the account and budget transformers resolve a currency from the
    // currency store while they run.
    useCurrencyStore().applyCurrenciesList(get(data, 'currencies', []))
    useCurrencyStore().applyExchangeRates(get(data, 'exchange-rates', {}))

    useAccountStore().applyAccountList(get(data, 'accounts', []))
    useCategoryStore().applyCategoryList(get(data, 'categories', []))
    useTagStore().applyTagList(get(data, 'tags', []))
    useBudgetStore().applyBudgetList(get(data, 'budgets', []))
    useBudgetStore().applyBudgetLimitList(get(data, 'budget-limits', []))
    usePiggyBankStore().applyPiggyBankList(get(data, 'piggy-banks', []))
    useRecurringTransactionStore().applyRecurringTransactionList(get(data, 'recurrences', []))
    useTemplateStore().applyTransactionTemplateList(get(data, 'transaction-templates', []))
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
    transcriptionLanguage,

    windowWidth,
    activePage,
    isDesktopLayout,
    gridColumns,
    hasAuthToken,
    isNewVersionAvailable,
    fetchInfo,
    lastSync,
    lastSyncCheck,
    syncHash,
    isSyncing,
    isSyncRequiredByMissingExtras,
    syncEverythingIfOld,
    syncEverythingIfStale,
    syncEverything,
  }
})
