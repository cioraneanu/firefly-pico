import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { get } from 'lodash-es'
import { addDays } from 'date-fns'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import { useProfileStore } from '~/stores/profileStore'
import { useDashboardStore } from '~/stores/dashboardStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'
import TransactionRepository from '~/repository/TransactionRepository'
import TransactionTransformer from '~/transformers/TransactionTransformer'
import BudgetRepository from '~/repository/BudgetRepository.js'
import BudgetLimitRepository from '~/repository/BudgetLimitRepository.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'
import BudgetLimitTransformer from '~/transformers/BudgetLimitTransformer.js'
import Budget from '~/models/Budget.js'
import BudgetLimit from '~/models/BudgetLimit.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import SummaryRepository from '~/repository/SummaryRepository.js'
import AccountRepository from '~/repository/AccountRepository.js'
import AccountTransformer from '~/transformers/AccountTransformer.js'
import Account from '~/models/Account.js'
import Currency from '~/models/Currency.js'
import { convertCurrency } from '~/utils/CurrencyUtils'
import DateUtils from '~/utils/DateUtils'
import { getExcludedTransactionFilters } from '~/utils/DashboardUtils'
import { mapWithConcurrency } from '~/utils/ConcurrencyUtils'
import { eachFinancialMonth, financialMonthKey, currentFinancialMonth } from '~/utils/DateRangeUtils'
import { buildMonthlyFact, factFilterHash, assignColorSlots, rankTopNWithOther, rankTopNByMagnitudeWithOther, leastSquaresSlope, budgetSeverity } from '~/utils/AnalyticsUtils'
import { seriesColor } from '~/utils/ChartUtils'
import { buildAnalyticsFilterPlan, expandFanOutCombos } from '~/utils/AnalyticsFilterUtils'
import { useAnalyticsFilters } from '~/composables/useAnalyticsFilters'
import {
  ANALYTICS_SCHEMA_VERSION,
  ANALYTICS_PAGE_SIZE,
  ANALYTICS_FETCH_CONCURRENCY,
  ANALYTICS_FETCH_TIMEOUT_MS,
  ANALYTICS_BACKEND_CAP_MS,
  ANALYTICS_CURRENT_MONTH_CACHE_TTL_MS,
  ANALYTICS_SUBQUERY_CONCURRENCY,
  ANALYTICS_COMPOSITION_TOP_N,
  ANALYTICS_RANKED_TOP_N,
  ANALYTICS_HEATMAP_MAX_ROWS,
  NET_WORTH_SCHEMA_VERSION,
} from '~/constants/AnalyticsConstants'

export const useAnalyticsStore = defineStore('analytics', () => {
  const profileStore = useProfileStore()
  const dashboardStore = useDashboardStore()
  const currencyStore = useCurrencyStore()
  const { snapshot: analyticsFilterSnapshot } = useAnalyticsFilters()

  // Persisted — the fact cache is the ONLY analytics state that survives reload. Raw
  // transactions are never persisted, only the compact reduced facts.
  const factCache = useLocalStorage('analyticsFactCache', {})
  const analyticsCurrency = useLocalStorage('analyticsCurrency', null, { serializer: StorageSerializers.object })

  // Session-only. A 'loading' status frozen into localStorage would survive reload as a
  // permanent lie (the request that set it is dead) — this is a category error to persist,
  // not a size optimization.
  const monthStatus = ref({})
  const isRefreshing = ref(false)

  // ----- Phase 4a — Budgets. Session-only, unlike factCache — budget definitions and limits are
  // one cheap request for the whole range (not a per-month fan-out), so there's no payoff to
  // persisting them across reloads the way the transaction fan-out has.
  const budgetList = ref([])
  // The FULL range x ALL budgets fetch — expensive on Firefly's own side (it computes `spent` per
  // limit it returns, so this scales with months x budgets x limit-cadence) and only the overspend
  // table actually needs the whole thing; kept as its own state, fetched only by that section.
  const budgetLimitList = ref([])
  const isLoadingBudgetLimits = ref(false)
  // Dedupes concurrent fetchBudgetList() calls (e.g. the page's own onRefresh and the burn-rate
  // section's self-sufficient fetch both wanting it at once) into a single in-flight request.
  let budgetListFetchPromise = null
  // TODAY only, all budgets — what the accordion's meters and the burn-rate eligibility ranking
  // both actually need ("current status"), independent of however wide the page's selected range
  // is. Kept separate from budgetLimitList so those two sections never have to wait on (or pay
  // the cost of) the full-range fetch just to show "today."
  const currentBudgetLimits = ref([])
  const isLoadingCurrentBudgetLimits = ref(false)
  let currentBudgetLimitsPromise = null
  // Per-budget, scoped to exactly one budget's limits over the page's range — what the accordion's
  // per-budget vs-limit chart needs, fetched lazily only when that budget's panel is expanded.
  // Keyed by `${budgetId}_${startStr}_${endStr}` so a range change naturally invalidates it rather
  // than serving stale data for the old range. Uses the per-budget `/budgets/{id}/limits` endpoint
  // directly for better performance than filtering the wide `/budget-limits` endpoint.
  const budgetLimitsByBudget = ref({})

  // ----- Net worth. Persisted (like factCache) — a past month's balance snapshot is immutable
  // once recorded, and each month costs two real HTTP requests, so surviving reload has a real
  // payoff. Its own store slice, not an extension of factCache/MonthlyFact — net worth is a
  // balance SNAPSHOT per month-end (stock), not a transaction aggregate (flow), same reasoning
  // that made Budgets its own slice above. Keyed by financial-month key like factCache/monthStatus.
  const netWorthCache = useLocalStorage('analyticsNetWorthCache', {})

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
      // The analytics-only dimensional filter (Part 3) — reading analyticsFilterSnapshot() here
      // inside a computed correctly tracks the underlying refs it reads, same as any composable call.
      analyticsFilters: analyticsFilterSnapshot(),
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
  const budgetSeriesColorMap = computed(() => assignColorSlots(rankedIds('byBudget')))

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

  // ----- Where the money goes (Phase 3b) — range-scoped, unlike rankedIds() above which is
  // deliberately whole-factCache-scoped for colour-map stability. "Who's in the top N for this
  // view" (here) is allowed to shift with the range; "what colour they get" (categorySeriesColorMap
  // etc.) is not — see ANALYTICS_PLAN.md Part 1 "colour follows the entity, never the rank."

  function dimensionTotals(months, dimension) {
    const keys = new Set(months.map((month) => month.key))
    const totals = {}
    for (const [key, fact] of Object.entries(factCache.value)) {
      if (!keys.has(key)) continue
      for (const [id, value] of Object.entries(fact[dimension] ?? {})) {
        const amountMap = dimension === 'byMerchant' ? value.amount : value
        totals[id] = (totals[id] ?? 0) + sumConverted(amountMap)
      }
    }
    return totals
  }

  const dimensionColorMaps = { byCategory: categorySeriesColorMap, byTag: tagSeriesColorMap }

  function compositionSeries(months, dimension) {
    const totals = dimensionTotals(months, dimension)
    const { topIds, otherTotal } = rankTopNWithOther(totals, ANALYTICS_COMPOSITION_TOP_N)
    const colorMap = dimensionColorMaps[dimension].value
    const series = topIds.map((id) => ({ id, colorVar: seriesColor(colorMap[id]) }))
    if (otherTotal > 0) series.push({ id: 'other', colorVar: seriesColor('other') })

    const rows = months.map(({ key }) => {
      const fact = factCache.value[key]
      const values = {}
      for (const id of topIds) {
        const amountMap = dimension === 'byMerchant' ? fact?.[dimension]?.[id]?.amount : fact?.[dimension]?.[id]
        values[id] = amountMap ? sumConverted(amountMap) : 0
      }
      if (otherTotal > 0) {
        let otherSum = 0
        for (const [id, value] of Object.entries(fact?.[dimension] ?? {})) {
          if (topIds.includes(id)) continue
          const amountMap = dimension === 'byMerchant' ? value.amount : value
          otherSum += sumConverted(amountMap)
        }
        values.other = otherSum
      }
      return { key, isLoaded: !!fact, values }
    })

    return { series, rows }
  }

  // ----- Phase 3c — savings-rate line, month-over-month, spending drift, category x month heatmap

  function savingsRateSeries(months) {
    return monthlyTotals(months).map(({ key, income, net, isLoaded }) => ({
      key,
      isLoaded,
      // null, not 0, on a zero/negative-income month — mirrors periodAverages()' own rule
      // (a zero-income month is unknown, not a 0% savings rate).
      rate: isLoaded && income > 0 ? net / income : null,
    }))
  }

  function dimensionAmount(fact, dimension, id) {
    if (!fact) return 0
    const entry = fact[dimension]?.[id]
    return sumConverted(dimension === 'byMerchant' ? entry?.amount : entry)
  }

  // Excludes the in-progress financial month and requires every remaining month in range to
  // already be a loaded fact before computing anything. A partially-loaded window can't tell "no
  // spending that month" (a true zero, correctly included in the regression) apart from "not
  // fetched yet" (unknown) — silently treating the latter as zero would reproduce the exact
  // compressed-x-axis bug ANALYTICS_PLAN.md's Context section calls out in the Streamlit build.
  // So, unlike every other section on this page, this one waits for full range load rather than
  // progressively rendering.
  function spendingDrift(months, dimension) {
    const firstDayOfMonth = profileStore.dashboard.firstDayOfMonth
    const currentKey = financialMonthKey(currentFinancialMonth(new Date(), firstDayOfMonth).start)
    const completeMonths = months.filter((month) => month.key !== currentKey)
    if (completeMonths.length < 3) return { rows: [], isEligible: false }

    const facts = completeMonths.map((month) => factCache.value[month.key])
    if (facts.some((fact) => !fact)) return { rows: [], isEligible: false }

    const ids = new Set()
    for (const fact of facts) for (const id of Object.keys(fact[dimension] ?? {})) ids.add(id)

    const slopes = {}
    for (const id of ids) {
      const ys = facts.map((fact) => dimensionAmount(fact, dimension, id))
      // xs = true index over every complete month in range — gap months are a real 0, never
      // compressed out, which is the whole point (see the function comment above).
      const fit = leastSquaresSlope(
        ys.map((_, index) => index),
        ys,
      )
      if (fit) slopes[id] = fit.slope
    }

    const { topIds, otherValue } = rankTopNByMagnitudeWithOther(slopes, ANALYTICS_RANKED_TOP_N)
    const rows = topIds.map((id) => ({ id, slope: slopes[id] }))
    if (topIds.length < Object.keys(slopes).length) rows.push({ id: 'other', slope: otherValue })
    // start/end of the window actually regressed over (excludes the in-progress month) — handed
    // back so a drill-through can scope to exactly what produced the slope, without the caller
    // re-deriving the same "exclude current month" filter itself.
    return { rows, isEligible: true, start: completeMonths[0].start, end: completeMonths.at(-1).end }
  }

  function categoryMonthMatrix(months, maxRows = ANALYTICS_HEATMAP_MAX_ROWS) {
    // No Other row here — "top 30 rows" (Part 1/2) means the tail simply isn't shown, unlike the
    // composition chart where folding the tail into a visible bucket is the point.
    const { topIds } = rankTopNWithOther(dimensionTotals(months, 'byCategory'), maxRows)
    const rows = topIds.map((id) => ({
      id,
      values: months.map(({ key }) => {
        const fact = factCache.value[key]
        return { key, value: fact ? sumConverted(fact.byCategory?.[id]) : 0, isLoaded: !!fact }
      }),
    }))
    const maxValue = Math.max(0, ...rows.flatMap((row) => row.values.map((v) => v.value)))
    return { rows, maxValue }
  }

  // ----- Phase 4a — Budgets. Deliberately built on Firefly's own per-limit `spent`/`amount`
  // (BudgetLimitTransformer, already server-computed per limit period) rather than re-deriving
  // "actual spend" from MonthlyFact.byBudget — this correctly handles non-monthly limit periods
  // and budget types (reset/rollover/adjusted) for free, exactly like the existing Dashboard
  // budget widget already relies on (dashboard-budget-item.vue reads budgetLimit.attributes.spent
  // directly, never recomputes from transactions). The one place this can't substitute is the
  // burn-rate pacing chart below, which needs DAY granularity no Firefly limit-period aggregate
  // carries — that one function fetches raw transactions instead.

  function limitsOverlapping(budgetId, start, end, limits = budgetLimitList.value) {
    return limits.filter((limit) => {
      if (String(get(limit, 'attributes.budget_id')) !== String(budgetId)) return false
      const limitStart = get(limit, 'attributes.start')
      const limitEnd = get(limit, 'attributes.end')
      return limitStart <= end && limitEnd >= start
    })
  }

  // Best-effort currency conversion — a budget limit's currency isn't on the limit itself, only
  // reachable via the parent budget (same attribute path Budget.getCurrencySymbol already reads).
  // Falls back to the raw, unconverted amount if that path is missing, matching the Dashboard
  // budget widget's existing behaviour (which does no conversion at all) — so this can only be a
  // strict improvement over today, never a regression.
  function convertBudgetAmount(amount, budgetId) {
    const budget = budgetList.value.find((b) => String(b.id) === String(budgetId))
    const code = get(budget, 'attributes.currency.attributes.code')
    return code ? convertCurrency(amount, code, currencyCode.value) : amount
  }

  // The limit period covering TODAY — what the per-budget meter and burn-rate eligibility ranking
  // both mean by "current." Defaults to the small currentBudgetLimits fetch (today only, all
  // budgets), NOT budgetLimitList (the expensive whole-range fetch) — callers that already have a
  // wider limits list on hand (e.g. the overspend table iterating budgetVsLimitSeries) can still
  // pass it explicitly, but the common case (an accordion meter) never needs more than today.
  function budgetSeverityStatus(budgetId, limitsSource = currentBudgetLimits.value) {
    const today = new Date()
    const limits = limitsOverlapping(budgetId, today, today, limitsSource)
    if (limits.length === 0) return { percent: null, severity: null, limit: null, spent: null, intervalLabel: null }
    const limit = limits.find((l) => get(l, 'attributes.start') <= today && get(l, 'attributes.end') >= today) ?? limits[0]
    const limitAmount = convertBudgetAmount(get(limit, 'attributes.amount') ?? 0, budgetId)
    const spent = convertBudgetAmount(Math.abs(get(limit, 'attributes.spent') ?? 0), budgetId)
    const percent = limitAmount > 0 ? Math.round((spent * 100) / limitAmount) : 0
    return { percent, severity: budgetSeverity(percent), limit: limitAmount, spent, intervalLabel: BudgetLimit.getLimitInterval(limit) }
  }

  // One row per month in range — actual/limit null when no limit period overlaps that month
  // (uPlot renders a null data point as a gap, same convention as every other Phase 3c chart).
  // limitsSource defaults to budgetLimitList (the overspend table's use case — it needs every
  // budget over the whole range anyway); the accordion's per-budget chart instead passes its own
  // lazily-fetched, single-budget-scoped list (see budgetLimitsByBudget above).
  function budgetVsLimitSeries(budgetId, months, limitsSource = budgetLimitList.value) {
    return months.map((month) => {
      const limits = limitsOverlapping(budgetId, month.start, month.end, limitsSource)
      if (limits.length === 0) return { key: month.key, start: month.start, end: month.end, actual: null, limit: null, intervalLabel: null }
      const actual = convertBudgetAmount(
        limits.reduce((sum, l) => sum + Math.abs(get(l, 'attributes.spent') ?? 0), 0),
        budgetId,
      )
      const limitAmount = convertBudgetAmount(
        limits.reduce((sum, l) => sum + (get(l, 'attributes.amount') ?? 0), 0),
        budgetId,
      )
      return { key: month.key, start: month.start, end: month.end, actual, limit: limitAmount, intervalLabel: BudgetLimit.getLimitInterval(limits[0]) }
    })
  }

  // Burn-rate pacing moved to dashboardStore.budgetPace (Home widget dashboard-budget-pace.vue) —
  // it was always "current financial month only," never the page's selected range, so it belongs
  // on Home, not Analytics.

  // ----- Phase 4b — Behaviour (day-of-week, detected recurring). Both reduce over the
  // already-cached factCache, same as Where-the-money-goes above — no new fetching.

  function weekdayTotals(months) {
    const keys = new Set(months.map((month) => month.key))
    const totals = new Array(7).fill(0)
    for (const [key, fact] of Object.entries(factCache.value)) {
      if (!keys.has(key)) continue
      for (let day = 0; day < 7; day++) totals[day] += sumConverted(fact.byWeekday?.[day])
    }
    return totals
  }

  // Cached recurring transaction totals keyed by `recurringId_startDate_endDate`
  const recurringTransactionTotals = ref({})
  let lastRecurringFetchCacheKey = null
  const recurringFetchInitialized = ref(false)

  // Fetch actual transactions for each recurring transaction and cache the totals
  async function fetchRecurringTransactionTotals(start, end) {
    if (!start || !end) return

    const recurringStore = useRecurringTransactionStore()
    const recurringRepository = new (await import('~/repository/RecurringTransactionRepository.js')).default()
    const cacheKey = `${start.getTime()}_${end.getTime()}`
    const dateFilters = [`date_after:${DateUtils.dateToString(start)}`, `date_before:${DateUtils.dateToString(end)}`]

    const allRecurring = Object.values(recurringStore.recurringTransactionDictionary)

    const activeRecurring = allRecurring.filter((entry) => {
      if (!RecurringTransaction.isActive(entry)) return false
      const typeValue = get(entry, 'attributes.type')
      const type = typeof typeValue === 'string' ? typeValue : get(typeValue, 'code')
      return type === 'expense' || type === 'withdrawal'
    })

    const results = {}
    const settled = await mapWithConcurrency(
      activeRecurring,
      async (entry) => {
        const id = entry.id
        const description = get(entry, 'attributes.description', 'Unknown')
        try {
          const response = await recurringRepository.getTransactionsByRecurringId(id, {
            filters: dateFilters,
            pageSize: 250,
            showLoading: false,
            timeout: ANALYTICS_FETCH_TIMEOUT_MS,
          })
          // API returns recurrence objects with transactions nested in attributes.transactions
          const recurrences = get(response, 'data', [])
          let totalTransactions = 0
          let total = 0

          for (const recurrence of recurrences) {
            const transactions = get(recurrence, 'attributes.transactions', [])
            totalTransactions += transactions.length
            for (const transaction of transactions) {
              // transaction has amount (string) and currency_code
              const amount = convertCurrency(parseFloat(transaction.amount), transaction.currency_code, currencyCode.value)
              total += amount
            }
          }
          return { id, total }
        } catch (e) {
          console.error(`[Analytics] Failed to fetch transactions for recurring ${id} (${description}):`, e)
          return { id, total: 0 }
        }
      },
      { concurrency: 2 },
    )

    for (const { value, error } of settled) {
      if (value) {
        results[value.id] = value.total
      }
    }

    recurringTransactionTotals.value[cacheKey] = results
    lastRecurringFetchCacheKey = cacheKey
    recurringFetchInitialized.value = true
  }

  // Every ACTIVE Firefly recurrence with the total amount of its transactions in the selected range.
  function knownRecurringRows(months) {
    const recurringStore = useRecurringTransactionStore()
    if (months.length === 0 || !recurringFetchInitialized.value) return []

    // Use the cache key from the last fetch (refresh), since refresh uses a wider range that includes prior months
    const cacheKey = lastRecurringFetchCacheKey
    const totalsCache = cacheKey ? (recurringTransactionTotals.value[cacheKey] ?? {}) : {}

    return Object.values(recurringStore.recurringTransactionDictionary)
      .filter((entry) => {
        if (!RecurringTransaction.isActive(entry)) return false
        // Only include expenses (same filter as fetchRecurringTransactionTotals)
        const typeValue = get(entry, 'attributes.type')
        const type = typeof typeValue === 'string' ? typeValue : get(typeValue, 'code')
        return type === 'expense' || type === 'withdrawal'
      })
      .map((entry) => ({
        merchantId: get(entry, 'attributes.accountDestination.id'),
        recurrence: entry,
        totalInRange: totalsCache[entry.id] ?? 0,
      }))
      .filter((row) => row.merchantId != null && row.totalInRange > 0)
      .sort((a, b) => (b.totalInRange ?? 0) - (a.totalInRange ?? 0))
  }

  // Month-in-progress projection moved to dashboardStore.monthProjection (Home widget
  // dashboard-month-projection.vue) — it was always "the current financial month so far," never
  // the page's selected range, so it belongs on Home, not Analytics.

  // ----- Actions

  // One sub-request's worth of getAllPages, given a complete filtersParts array (base date/exclusion
  // fragments + this combo's fan-out values). Shared by both the simple (no fan-out) and fan-out paths.
  async function fetchFilteredPages(filtersParts, monthConcurrency) {
    const filters = [{ field: 'query', value: filtersParts.join(' ') }]
    return new TransactionRepository().getAllPages({
      filters,
      getAll: new TransactionRepository().searchTransaction,
      pageSize: ANALYTICS_PAGE_SIZE,
      concurrency: monthConcurrency,
      showLoading: false, // MUST be false — a 24-way fan-out would otherwise pin the global spinner
      timeout: ANALYTICS_FETCH_TIMEOUT_MS,
    })
  }

  // Shared by fetchMonth AND every other scoped raw-transaction fetch that needs the CURRENT
  // analytics dimensional filter applied (burn-rate pacing, month-in-progress projection) — folds
  // in date range + persistent exclusions + the analytics filter's simple fragments, fans out one
  // sub-request per combo when a 2+-selected name-based dimension needs it (Part 3), and merges +
  // dedupes the raw JSON:API groups by id. Previously this fan-out/merge logic lived only inside
  // fetchMonth, which is why burn-rate/projection's own ad-hoc single fetchFilteredPages() calls
  // silently ignored the analytics filter entirely — extracted here so there is exactly one place
  // that knows how to apply it, and every scoped fetch gets it for free.
  //
  // Returns RAW (untransformed) groups — Firefly's *_is operators match at the group level, so a
  // returned group's OTHER splits can still fail to match the filter (splitMatchesAnalyticsFilters
  // must be applied per split by the caller; buildMonthlyFact already does this for fetchMonth).
  async function fetchFilteredTransactionsForRange(start, end, { concurrency = ANALYTICS_FETCH_CONCURRENCY } = {}) {
    const baseFiltersParts = [`date_after:${DateUtils.dateToString(start)}`, `date_before:${DateUtils.dateToString(end)}`, ...getExcludedTransactionFilters()]

    const { simpleFragments, fanOutGroups } = buildAnalyticsFilterPlan(analyticsFilterSnapshot())
    const filtersParts = [...baseFiltersParts, ...simpleFragments]
    const combos = expandFanOutCombos(fanOutGroups) // [[]] when no fan-out needed — one combo, zero extra fragments

    // Scale page concurrency down as combos grow, so total in-flight requests stay roughly
    // bounded regardless of how many values are selected — see ANALYTICS_PLAN.md Part 3.
    const subConcurrency = Math.max(1, Math.floor(concurrency / combos.length))
    const settled = await mapWithConcurrency(combos, (combo) => fetchFilteredPages([...filtersParts, ...combo], subConcurrency), { concurrency: ANALYTICS_SUBQUERY_CONCURRENCY })

    // Merge sub-requests: AND isComplete (any partial combo marks the whole range incomplete),
    // tag failedPages with which combo produced them (page numbers aren't globally unique once a
    // range has N sub-queries each with their own page 1..k), and dedupe raw groups by id (a
    // group can appear in >1 combo if it matches multiple included values).
    let isComplete = true
    const failedPages = []
    const rawById = new Map()
    for (const { value, error, index } of settled) {
      if (error || !value) {
        isComplete = false
        failedPages.push({ combo: index, page: null, error })
        continue
      }
      isComplete = isComplete && value.isComplete
      for (const page of value.failedPages ?? []) failedPages.push({ combo: index, page })
      for (const item of value.data ?? []) rawById.set(item.id, item)
    }
    return { data: [...rawById.values()], isComplete, failedPages }
  }

  async function fetchMonth({ key, start, end }) {
    monthStatus.value[key] = { state: 'loading', error: null, failedPages: [], fetchedAt: null }

    try {
      const t0 = performance.now()
      const { data, isComplete, failedPages } = await fetchFilteredTransactionsForRange(start, end)
      const wallMs = performance.now() - t0

      const transformed = TransactionTransformer.transformFromApiList(data)
      const fact = buildMonthlyFact(transformed, {
        monthKey: key,
        rangeStart: start,
        rangeEnd: end,
        tagsWidgetModeOnlyRootTag: dashboardStore.tagsWidgetModeOnlyRootTag,
        isComplete,
        failedPages,
        // Firefly's *_is query operators match at the group level and return every split in a
        // matching group — re-checked here per split so a sibling split under a different
        // budget/category/tag/account never leaks into a by* breakdown map. See
        // AnalyticsFilterUtils.js's splitMatchesAnalyticsFilters for why.
        analyticsFilters: analyticsFilterSnapshot(),
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

    // Fetch actual transactions for each recurring transaction to get accurate totals
    await fetchRecurringTransactionTotals(start, end)

    logRefreshSummary({ wallMs: performance.now() - t0, monthCount: months.length, fetchedCount: toFetch.length })
    isRefreshing.value = false
  }

  async function retryMonth({ key, start, end }) {
    await fetchMonth({ key, start, end }) // always forces — explicit user action
  }

  // Both budget endpoints go through getAllPages (not the simpler getAllWithMerge every other
  // budgetStore.js caller uses) specifically for the { showLoading: false, timeout } override —
  // getAllWithMerge's underlying getAll() has no way to raise the timeout above the app's generic
  // 8s default (nuxt.config.ts queryTimeout), which is fine for the Dashboard's single-month
  // fetch but genuinely too tight for a wide analytics range or a budget with many limit periods
  // (the exact bug: a 6-month range timing out at 8000ms). Every other analytics fetch already
  // makes this same override for this same reason (see ANALYTICS_FETCH_TIMEOUT_MS's own comment).
  // budgetId narrows the query to one budget (Firefly's own /budget-limits endpoint supports a
  // budget_id filter) — used by fetchBudgetLimitsForBudget below to keep the per-budget chart's
  // fetch cheap regardless of how many OTHER budgets exist.
  async function fetchBudgetLimitsRaw(start, end, budgetId = null) {
    if (!profileStore.budgetsEnabled) return []
    // Firefly rejects start === end on this endpoint ("start date must be before end date") — a
    // single-day query has to be expressed as [day, day+1), not [day, day]. Guarded centrally
    // here, not just at fetchCurrentBudgetLimits's one call site, so no future caller can
    // reintroduce the same failure.
    const safeEnd = end <= start ? addDays(start, 1) : end
    const filters = [
      { field: 'start', value: DateUtils.dateToString(start) },
      { field: 'end', value: DateUtils.dateToString(safeEnd) },
    ]
    if (budgetId != null) filters.push({ field: 'budget_id', value: budgetId })
    const result = await new BudgetLimitRepository().getAllPages({ filters, showLoading: false, timeout: ANALYTICS_FETCH_TIMEOUT_MS })
    return BudgetLimitTransformer.transformFromApiList(result.data)
  }

  async function fetchBudgetList() {
    if (!profileStore.budgetsEnabled) {
      budgetList.value = []
      return
    }
    if (budgetList.value.length > 0) return // budgets aren't range-scoped — fetch once per session
    if (!budgetListFetchPromise) {
      budgetListFetchPromise = new BudgetRepository()
        .getAllPages({ showLoading: false, timeout: ANALYTICS_FETCH_TIMEOUT_MS })
        .then((result) => {
          budgetList.value = BudgetTransformer.transformFromApiList(result.data)
        })
        .finally(() => {
          budgetListFetchPromise = null
        })
    }
    await budgetListFetchPromise
  }

  // Fetch limits for all budgets in parallel using per-budget endpoint (faster than fetching all at once).
  // Uses concurrency control to avoid overwhelming Firefly API.
  async function fetchAllBudgetLimitsInRange(start, end) {
    if (!profileStore.budgetsEnabled || budgetList.value.length === 0) return []
    const safeEnd = end <= start ? addDays(start, 1) : end
    const startStr = DateUtils.dateToString(start)
    const endStr = DateUtils.dateToString(safeEnd)
    const budgetRepository = new BudgetRepository()

    const settled = await mapWithConcurrency(
      budgetList.value,
      async (budget) => {
        try {
          const response = await budgetRepository.getLimitsForBudget(budget.id, {
            start: startStr,
            end: endStr,
            showLoading: false,
            timeout: ANALYTICS_FETCH_TIMEOUT_MS,
          })
          return { budget: budget.id, limits: get(response, 'data', []) }
        } catch (e) {
          console.error(`[Analytics] Failed to fetch limits for budget ${budget.id}:`, e)
          return { budget: budget.id, limits: [] }
        }
      },
      { concurrency: 2 },
    )

    const allLimits = []
    for (const { value } of settled) {
      if (value?.limits) {
        allLimits.push(...value.limits)
      }
    }
    return BudgetLimitTransformer.transformFromApiList(allLimits)
  }

  // "Today, all budgets" — cheap regardless of the page's selected range, since it's always a
  // single-day window. Backs the accordion's meters and burn-rate's eligibility ranking; see
  // budgetSeverityStatus's own comment for why this replaced depending on budgetLimitList.
  async function fetchCurrentBudgetLimits() {
    if (!profileStore.budgetsEnabled) {
      currentBudgetLimits.value = []
      return
    }
    if (!currentBudgetLimitsPromise) {
      isLoadingCurrentBudgetLimits.value = true
      const today = new Date()
      // "Today" is a single calendar day (start === end) — fetchBudgetLimitsRaw widens that to a
      // real [today, tomorrow) window itself (Firefly rejects start === end). The extra day is
      // harmless slack here: limitsOverlapping()/budgetSeverityStatus() still only accept a limit
      // whose OWN interval actually covers today.
      currentBudgetLimitsPromise = fetchBudgetLimitsRaw(today, today)
        .then((limits) => {
          currentBudgetLimits.value = limits
        })
        .finally(() => {
          isLoadingCurrentBudgetLimits.value = false
          currentBudgetLimitsPromise = null
        })
    }
    await currentBudgetLimitsPromise
  }

  // One budget, over the given range — what the accordion's per-budget vs-limit chart fetches
  // lazily on expand, instead of depending on the ALL-budgets/WHOLE-range budgetLimitList. Cached
  // by (budgetId, range) so re-collapsing/re-expanding the same panel doesn't refetch, but a range
  // change (a new key) does. Uses per-budget endpoint directly for better performance.
  // Note: Firefly times out on date-filtered queries, so we fetch all limits and filter client-side.
  async function fetchBudgetLimitsForBudget(budgetId, start, end) {
    if (!profileStore.budgetsEnabled) return
    const key = `${budgetId}_${DateUtils.dateToString(start)}_${DateUtils.dateToString(end)}`
    if (budgetLimitsByBudget.value[key]) return
    try {
      // Fetch all limits without date filters (Firefly times out on wide date ranges even for single budgets)
      const response = await new BudgetRepository().getLimitsForBudget(budgetId, {
        showLoading: false,
        timeout: ANALYTICS_FETCH_TIMEOUT_MS,
      })
      const allLimits = BudgetLimitTransformer.transformFromApiList(get(response, 'data', []))

      // Filter to only limits that overlap with the requested range
      const filteredLimits = allLimits.filter((limit) => {
        const limitStart = new Date(limit.attributes.start)
        const limitEnd = new Date(limit.attributes.end)
        return limitStart <= end && limitEnd >= start
      })

      budgetLimitsByBudget.value = { ...budgetLimitsByBudget.value, [key]: filteredLimits }
    } catch (e) {
      console.error(`[Analytics] Failed to fetch limits for budget ${budgetId}:`, e)
      budgetLimitsByBudget.value = { ...budgetLimitsByBudget.value, [key]: [] }
    }
  }

  function budgetLimitsFor(budgetId, start, end) {
    const key = `${budgetId}_${DateUtils.dateToString(start)}_${DateUtils.dateToString(end)}`
    return budgetLimitsByBudget.value[key] ?? []
  }

  // ----- Net worth (hybrid fetch — see analyticsStore's netWorthCache comment above and
  // ANALYTICS_PLAN.md's Net Worth plan for the full reasoning). Deliberately does NOT check
  // currentFilterHash — net worth comes from account balances (via Firefly's own summary
  // endpoint and the accounts endpoint), never from filtered transactions, so the analytics
  // dimensional filter and persistent exclusion lists don't apply. Same scope boundary Budgets'
  // functions already draw above.
  function isNetWorthValid(monthKey, currentMonthKey) {
    const entry = netWorthCache.value[monthKey]
    if (!entry) return false
    if (entry.schemaVersion !== NET_WORTH_SCHEMA_VERSION) return false
    if (!entry.isComplete) return false
    if (monthKey === currentMonthKey) return Date.now() - entry.fetchedAt < ANALYTICS_CURRENT_MONTH_CACHE_TTL_MS
    return true
  }

  // Ports dashboardStore.dashboardAccountsInNetWorth's exact filter (asset/liability type, active,
  // include_net_worth).
  function accountsIncludedInNetWorth(list) {
    const netWorthTypes = [Account.types.asset.fireflyCode, Account.types.liability.fireflyCode]
    return list.filter((account) => account && netWorthTypes.includes(Account.getType(account)?.fireflyCode) && Account.getIsActive(account) && Account.getIsIncludedInNetWorth(account))
  }

  async function fetchNetWorthMonth({ key, start, end, isCurrent }) {
    const asOfEnd = isCurrent ? (new Date() < end ? new Date() : end) : end
    const startStr = DateUtils.dateToString(start)
    const endStr = DateUtils.dateToString(asOfEnd)

    try {
      const [summaryData, accountsResult] = await Promise.all([
        new SummaryRepository().getBasic({ start: startStr, end: endStr, timeout: ANALYTICS_FETCH_TIMEOUT_MS }),
        new AccountRepository().getAllPages({
          filters: [{ field: 'date', value: endStr }],
          pageSize: ANALYTICS_PAGE_SIZE,
          concurrency: ANALYTICS_SUBQUERY_CONCURRENCY,
          showLoading: false,
          timeout: ANALYTICS_FETCH_TIMEOUT_MS,
        }),
      ])

      // Matched by key PREFIX, currency read from the entry's own currency_code — never
      // hardcoded or parsed from the key's suffix. balance-in-*/spent-in-*/etc. are ignored:
      // confirmed against a real instance to be period-flow figures (they grow with the
      // start/end range), not stock snapshots — only net-worth-in-* is a true as-of-`end` value.
      const netWorthByCurrency = {}
      for (const entry of Object.values(summaryData ?? {})) {
        if (entry?.key?.startsWith('net-worth-in-') && entry?.currency_code) {
          netWorthByCurrency[entry.currency_code] = parseFloat(entry.monetary_value)
        }
      }

      const accounts = accountsIncludedInNetWorth(AccountTransformer.transformFromApiList(accountsResult.data))
      const assetsByCurrency = {}
      const liabilitiesByCurrency = {}
      for (const account of accounts) {
        const code = Account.getCurrencyCode(account)
        const balance = parseFloat(Account.getBalance(account) ?? 0)
        const bucket = Account.getType(account)?.fireflyCode === Account.types.liability.fireflyCode ? liabilitiesByCurrency : assetsByCurrency
        bucket[code] = (bucket[code] ?? 0) + balance
      }

      netWorthCache.value[key] = {
        schemaVersion: NET_WORTH_SCHEMA_VERSION,
        monthKey: key,
        fetchedAt: Date.now(),
        netWorthByCurrency,
        assetsByCurrency,
        liabilitiesByCurrency,
        isComplete: accountsResult.isComplete,
      }
    } catch (e) {
      console.error(`[Analytics] Failed to fetch net worth for ${key}:`, e)
      netWorthCache.value[key] = { ...(netWorthCache.value[key] ?? {}), schemaVersion: NET_WORTH_SCHEMA_VERSION, monthKey: key, isComplete: false, fetchedAt: Date.now() }
    }
  }

  async function fetchNetWorthRange({ start, end, force = false } = {}) {
    const firstDayOfMonth = profileStore.dashboard.firstDayOfMonth
    const months = eachFinancialMonth(start, end, firstDayOfMonth).slice().reverse()
    const currentKey = financialMonthKey(currentFinancialMonth(new Date(), firstDayOfMonth).start)
    const toFetch = months.filter((m) => force || !isNetWorthValid(m.key, currentKey))
    await mapWithConcurrency(toFetch, (m) => fetchNetWorthMonth({ ...m, isCurrent: m.key === currentKey }), { concurrency: ANALYTICS_SUBQUERY_CONCURRENCY })
  }

  // Bars chart — app-chart-bars.vue's {key,isLoaded,income,expense,net} contract directly: assets
  // as income, liabilities magnitude as expense, and the AUTHORITATIVE net-worth-in-X (not a
  // recomputation from assets/liabilities) as the net line — this net line IS the net worth
  // figure (Firefly's own /summary/basic value, not derived from assets/liabilities), so it's
  // the only place net worth is shown; no separate line chart (would just duplicate this).
  function assetsLiabilitiesTotals(months) {
    return months.map(({ key }) => {
      const entry = netWorthCache.value[key]
      if (!entry) return { key, isLoaded: false, income: 0, expense: 0, net: 0 }
      const assets = sumConverted(entry.assetsByCurrency)
      const liabilities = Math.abs(sumConverted(entry.liabilitiesByCurrency))
      const netWorth = sumConverted(entry.netWorthByCurrency)
      return { key, isLoaded: true, income: assets, expense: liabilities, net: netWorth }
    })
  }

  function netWorthCurrencyCodesInRange(months) {
    const codes = new Set()
    for (const { key } of months) {
      const entry = netWorthCache.value[key]
      if (!entry) continue
      Object.keys(entry.netWorthByCurrency).forEach((c) => codes.add(c))
      Object.keys(entry.assetsByCurrency).forEach((c) => codes.add(c))
      Object.keys(entry.liabilitiesByCurrency).forEach((c) => codes.add(c))
    }
    return [...codes]
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
    budgetSeriesColorMap,
    isFactValid,
    sumConverted,
    monthlyTotals,
    periodAverages,
    rangeSummary,
    dimensionTotals,
    compositionSeries,
    savingsRateSeries,
    spendingDrift,
    categoryMonthMatrix,
    fetchMonth,
    refresh,
    retryMonth,
    budgetList,
    budgetLimitList,
    isLoadingBudgetLimits,
    currentBudgetLimits,
    isLoadingCurrentBudgetLimits,
    budgetLimitsByBudget,
    budgetSeverityStatus,
    budgetVsLimitSeries,
    budgetLimitsFor,
    fetchBudgetList,
    fetchCurrentBudgetLimits,
    fetchBudgetLimitsForBudget,
    weekdayTotals,
    knownRecurringRows,
    fetchRecurringTransactionTotals,
    fetchNetWorthRange,
    assetsLiabilitiesTotals,
    netWorthCurrencyCodesInRange,
  }
})
