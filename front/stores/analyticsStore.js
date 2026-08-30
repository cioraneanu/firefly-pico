import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import { useProfileStore } from '~/stores/profileStore'
import { useDashboardStore } from '~/stores/dashboardStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import Currency from '~/models/Currency.js'
import { convertCurrency } from '~/utils/CurrencyUtils'
import DateUtils from '~/utils/DateUtils'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils'
import { mapWithConcurrency } from '~/utils/ConcurrencyUtils'
import { eachFinancialMonth, financialMonthKey, currentFinancialMonth } from '~/utils/DateRangeUtils'
import { buildMonthlyFact, factFilterHash, assignColorSlots } from '~/utils/AnalyticsUtils'
import { ANALYTICS_SCHEMA_VERSION, ANALYTICS_PAGE_SIZE, ANALYTICS_FETCH_CONCURRENCY, ANALYTICS_FETCH_TIMEOUT_MS, ANALYTICS_BACKEND_CAP_MS, ANALYTICS_CURRENT_MONTH_CACHE_TTL_MS } from '~/constants/AnalyticsConstants'

export const useAnalyticsStore = defineStore('analytics', () => {
  const profileStore = useProfileStore()
  const dashboardStore = useDashboardStore()
  const currencyStore = useCurrencyStore()

  // Persisted — the fact cache is the ONLY analytics state that survives reload. Raw
  // transactions are never persisted, only the compact reduced facts.
  const factCache = useLocalStorage('analyticsFactCache', {})
  const analyticsCurrency = useLocalStorage('analyticsCurrency', null, { serializer: StorageSerializers.object })

  // Session-only. A 'loading' status frozen into localStorage would survive reload as a
  // permanent lie (the request that set it is dead) — this is a category error to persist,
  // not a size optimization.
  const monthStatus = ref({})
  const isRefreshing = ref(false)

  // ----- Getters

  const currencyCode = computed(() => Currency.getCode(analyticsCurrency.value ?? dashboardStore.dashboardCurrency ?? currencyStore.defaultCurrency))

  const isAmountsHidden = computed(() => !profileStore.dashboard.showAccountAmounts)

  const currentFilterHash = computed(() =>
    factFilterHash({
      firstDayOfMonth: profileStore.dashboard.firstDayOfMonth,
      excludedAccountIds: profileStore.dashboard.excludedAccountsList.map((account) => account.id),
      excludedCategoryIds: profileStore.dashboard.excludedCategoriesList.map((category) => category.id),
      excludedTagIds: profileStore.dashboard.excludedTagsList.map((tag) => tag.id),
      tagsWidgetModeOnlyRootTag: dashboardStore.tagsWidgetModeOnlyRootTag,
    }),
  )

  const failedMonthKeys = computed(() =>
    Object.entries(monthStatus.value)
      .filter(([, status]) => status.state === 'error')
      .map(([key]) => key),
  )

  // One computed PER entity dimension — a category's slot has no relation to a tag's slot,
  // so these are independent rankings, not one shared map. Ranking needs currency conversion
  // (Pinia-dependent), so it happens here rather than in the pure AnalyticsUtils file;
  // assignColorSlots() itself stays pure, taking an already-sorted id list. Derived from the
  // FULL, pre-filter entity set so a later chart-legend filter never repaints survivors.
  function rankedIds(dimension) {
    const totals = {}
    for (const fact of Object.values(factCache.value)) {
      for (const [id, value] of Object.entries(fact[dimension] ?? {})) {
        const amountMap = dimension === 'byMerchant' ? value.amount : value
        const converted = Object.entries(amountMap).reduce((sum, [code, amount]) => sum + convertCurrency(amount, code, currencyCode.value), 0)
        totals[id] = (totals[id] ?? 0) + converted
      }
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id)
  }
  const categorySeriesColorMap = computed(() => assignColorSlots(rankedIds('byCategory')))
  const tagSeriesColorMap = computed(() => assignColorSlots(rankedIds('byTag')))
  const merchantSeriesColorMap = computed(() => assignColorSlots(rankedIds('byMerchant')))

  // ----- Cache validity — TTL applies only to the CURRENT financial month. Closed months
  // don't change under normal use; time-expiring all of them would defeat the design's
  // central payoff (cached months reused on the next visit) for a staleness cost only the
  // still-accumulating current month actually incurs.

  function isFactValid(monthKey, currentMonthKey) {
    const fact = factCache.value[monthKey]
    if (!fact) return false
    if (fact.schemaVersion !== ANALYTICS_SCHEMA_VERSION) return false
    if (fact.filterHash !== currentFilterHash.value) return false
    if (!fact.isComplete) return false // a partially-failed month is always eligible for auto-retry
    if (monthKey === currentMonthKey) return Date.now() - fact.fetchedAt < ANALYTICS_CURRENT_MONTH_CACHE_TTL_MS
    return true
  }

  // ----- Measurement instrumentation (dev-only, no UI) — matches the codebase's existing
  // dev-gate idiom (front/models/Account.js:35).

  function logMonthMeasurement({ key, wallMs, rawGroups, fact }) {
    if (process.env.NODE_ENV === 'production') return
    const rawBytes = JSON.stringify(rawGroups).length
    const factBytes = JSON.stringify(fact).length
    console.debug('[analytics] month fetched', {
      key,
      wallMs: Math.round(wallMs),
      trippedCap: wallMs >= ANALYTICS_BACKEND_CAP_MS,
      approachingCap: wallMs >= 8000,
      transactionCount: fact.transactionCount,
      rawBytes,
      bytesPerGroup: fact.transactionCount ? Math.round(rawBytes / fact.transactionCount) : 0,
      factBytes,
      factBytesByKey: Object.fromEntries(Object.keys(fact).map((k) => [k, JSON.stringify(fact[k]).length])),
    })
  }

  function logRefreshSummary({ wallMs, monthCount, fetchedCount }) {
    if (process.env.NODE_ENV === 'production') return
    console.debug('[analytics] refresh complete', {
      wallMs: Math.round(wallMs),
      monthCount,
      fetchedCount,
      totalCachedMonths: Object.keys(factCache.value).length,
      localStorageFootprintBytes: JSON.stringify(factCache.value).length,
    })
  }

  // ----- Read-side aggregation (Phase 2 — Headline & Cashflow). Plain functions, not
  // computeds, since the store stays range-agnostic (Phase 1's design choice) — the
  // reactive range itself lives in useAnalyticsRange.js, which passes month lists in.

  function sumConverted(amountMap) {
    return Object.entries(amountMap ?? {}).reduce((sum, [code, amount]) => sum + convertCurrency(amount, code, currencyCode.value), 0)
  }

  function monthlyTotals(months) {
    return months.map(({ key }) => {
      const fact = factCache.value[key]
      const income = fact ? sumConverted(fact.totals.income) : 0
      const expense = fact ? sumConverted(fact.totals.expense) : 0
      return { key, income, expense, net: income - expense, transactionCount: fact?.transactionCount ?? 0, isLoaded: !!fact }
    })
  }

  function periodAverages(months) {
    const totals = monthlyTotals(months).filter((month) => month.isLoaded)
    const count = totals.length
    const totalIncome = totals.reduce((sum, month) => sum + month.income, 0)
    const totalExpense = totals.reduce((sum, month) => sum + month.expense, 0)
    const totalNet = totalIncome - totalExpense
    const avgIncome = count ? totalIncome / count : 0
    const avgExpense = count ? totalExpense / count : 0
    const avgNet = avgIncome - avgExpense
    // Savings rate is null (not 0) on a zero-income period — a zero-income month is unknown, not 0%.
    const savingsRate = avgIncome > 0 ? avgNet / avgIncome : null
    return { totalIncome, totalExpense, totalNet, avgIncome, avgExpense, avgNet, savingsRate, monthsLoaded: count }
  }

  // months = current range, priorMonths = the preceding equal-length range (for signed KPI deltas)
  function rangeSummary(months, priorMonths = []) {
    const current = periodAverages(months)
    const prior = periodAverages(priorMonths)
    const totals = monthlyTotals(months)
    const largestMonth = totals.filter((month) => month.isLoaded).reduce((max, month) => (!max || month.expense > max.expense ? month : max), null)
    const transactionCount = totals.reduce((sum, month) => sum + month.transactionCount, 0)
    return { ...current, largestMonth, transactionCount, prior }
  }

  // ----- Actions

  async function fetchMonth({ key, start, end }) {
    monthStatus.value[key] = { state: 'loading', error: null, failedPages: [], fetchedAt: null }

    try {
      const filtersParts = [`date_after:${DateUtils.dateToString(start)}`, `date_before:${DateUtils.dateToString(end)}`, ...getExcludedTransactionFilters()]
      const filters = [{ field: 'query', value: filtersParts.join(' ') }]

      const t0 = performance.now()
      const { data, isComplete, failedPages } = await new TransactionRepository().getAllPages({
        filters,
        getAll: new TransactionRepository().searchTransaction,
        pageSize: ANALYTICS_PAGE_SIZE,
        concurrency: ANALYTICS_FETCH_CONCURRENCY,
        showLoading: false, // MUST be false — a 24-way fan-out would otherwise pin the global spinner
        timeout: ANALYTICS_FETCH_TIMEOUT_MS,
      })
      const wallMs = performance.now() - t0

      const transformed = TransactionTransformer.transformFromApiList(data)
      const fact = buildMonthlyFact(transformed, {
        monthKey: key,
        rangeStart: start,
        rangeEnd: end,
        tagsWidgetModeOnlyRootTag: dashboardStore.tagsWidgetModeOnlyRootTag,
        isComplete,
        failedPages,
      })
      fact.fetchedAt = Date.now()
      fact.filterHash = currentFilterHash.value

      factCache.value[key] = fact
      monthStatus.value[key] = {
        state: isComplete ? 'success' : 'error',
        error: isComplete ? null : new Error(`month ${key}: ${failedPages.length} page(s) failed`),
        failedPages,
        fetchedAt: fact.fetchedAt,
      }
      logMonthMeasurement({ key, wallMs, rawGroups: data, fact })
    } catch (e) {
      // Guarantees monthStatus always resolves out of 'loading', even if something above
      // throws unexpectedly — mapWithConcurrency's "never rejects" contract would otherwise
      // silently swallow the throw and leave this month's status stuck at 'loading' forever.
      monthStatus.value[key] = { state: 'error', error: e, failedPages: [], fetchedAt: null }
    }
  }

  async function refresh({ start, end, force = false } = {}) {
    isRefreshing.value = true
    const t0 = performance.now()
    const firstDayOfMonth = profileStore.dashboard.firstDayOfMonth
    const months = eachFinancialMonth(start, end, firstDayOfMonth).slice().reverse() // newest-first
    const currentKey = financialMonthKey(currentFinancialMonth(new Date(), firstDayOfMonth).start)

    const toFetch = months.filter((month) => force || !isFactValid(month.key, currentKey))
    await mapWithConcurrency(toFetch, fetchMonth, { concurrency: ANALYTICS_FETCH_CONCURRENCY })

    logRefreshSummary({ wallMs: performance.now() - t0, monthCount: months.length, fetchedCount: toFetch.length })
    isRefreshing.value = false
  }

  async function retryMonth({ key, start, end }) {
    await fetchMonth({ key, start, end }) // always forces — explicit user action
  }

  return {
    factCache,
    analyticsCurrency,
    monthStatus,
    isRefreshing,
    currencyCode,
    isAmountsHidden,
    currentFilterHash,
    failedMonthKeys,
    categorySeriesColorMap,
    tagSeriesColorMap,
    merchantSeriesColorMap,
    isFactValid,
    sumConverted,
    monthlyTotals,
    periodAverages,
    rangeSummary,
    fetchMonth,
    refresh,
    retryMonth,
  }
})
