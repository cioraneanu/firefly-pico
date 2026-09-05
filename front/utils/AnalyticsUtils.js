import { get } from 'lodash-es'
import { getDay, addDays } from 'date-fns'
import DateUtils from '~/utils/DateUtils'
import { splitMatchesAnalyticsFilters } from '~/utils/AnalyticsFilterUtils'
import {
  ANALYTICS_SCHEMA_VERSION,
  ANALYTICS_CATEGORICAL_COLOR_SLOTS,
  ANALYTICS_IQR_MIN_SAMPLE,
  ANALYTICS_RECURRING_MIN_MONTHS,
  ANALYTICS_RECURRING_AMOUNT_TOLERANCE,
} from '~/constants/AnalyticsConstants'

// Deliberately Vue/Pinia-free — no Transaction model import (it transitively pulls in
// TransactionRepository -> axios -> useAppStore, and useProfileStore). Type-code literals
// are read via lodash.get() directly, matching the "pure, no Vue" bar set for ChartUtils.js.
const TYPE_CODE = { expense: 'expense', income: 'income', transfer: 'transfer' }

export function sumAmountMap(entries) {
  return (entries ?? []).reduce((map, { amount, currencyCode } = {}) => {
    if (!currencyCode || !amount) return map
    map[currencyCode] = (map[currencyCode] ?? 0) + amount
    return map
  }, {})
}

export function mergeAmountMaps(...maps) {
  return maps.reduce((result, map) => {
    for (const [code, amount] of Object.entries(map ?? {})) {
      result[code] = (result[code] ?? 0) + amount
    }
    return result
  }, {})
}

export function emptyFact(monthKey, { start, end } = {}) {
  return {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    monthKey,
    rangeStart: start ? DateUtils.dateToString(start) : null,
    rangeEnd: end ? DateUtils.dateToString(end) : null,
    fetchedAt: null,
    filterHash: null,
    isComplete: true,
    failedPages: [],
    transactionCount: 0,
    totals: { income: {}, expense: {}, transfer: {} },
    byCategory: {},
    byTag: {},
    byBudget: {},
    byMerchant: {},
    byWeekday: [{}, {}, {}, {}, {}, {}, {}], // index 0=Sun..6=Sat (date-fns getDay)
  }
}

// transactions: TransactionTransformer-transformed groups for ONE financial month.
// Every money value stays a raw { currencyCode: amount } map — conversion happens at
// read time in the store (via convertCurrency, which needs useCurrencyStore()), never here.
export function buildMonthlyFact(transactions, { monthKey, rangeStart, rangeEnd, tagsWidgetModeOnlyRootTag = true, isComplete = true, failedPages = [], analyticsFilters = null } = {}) {
  const fact = emptyFact(monthKey, { start: rangeStart, end: rangeEnd })
  fact.isComplete = isComplete
  fact.failedPages = failedPages
  fact.transactionCount = transactions.length

  for (const transaction of transactions) {
    const typeCode = get(transaction, 'attributes.transactions.0.type.code')
    const splits = get(transaction, 'attributes.transactions', [])

    for (const split of splits) {
      const amount = parseFloat(split.amount) || 0
      const entry = [{ amount, currencyCode: split.currency_code }]

      if (typeCode === TYPE_CODE.income) {
        fact.totals.income = mergeAmountMaps(fact.totals.income, sumAmountMap(entry))
        continue
      }
      if (typeCode === TYPE_CODE.transfer) {
        fact.totals.transfer = mergeAmountMaps(fact.totals.transfer, sumAmountMap(entry))
        continue
      }

      // expense (withdrawal) — every breakdown map below is expense-only in v1
      fact.totals.expense = mergeAmountMaps(fact.totals.expense, sumAmountMap(entry))

      // Firefly's {field}_is query operators match at the GROUP level — a group is returned
      // whole (every split) once ANY one of its splits matches, so a sibling split that doesn't
      // itself satisfy the active analytics filter (e.g. a different budget on the same
      // multi-line purchase) must be excluded here or it leaks into every breakdown below.
      // totals.expense above is deliberately NOT re-checked — it already has this same
      // "whole group counts" property by design (ANALYTICS_PLAN.md Part 3).
      if (analyticsFilters && !splitMatchesAnalyticsFilters(split, analyticsFilters)) continue

      const categoryId = split.category_id ?? 'none'
      fact.byCategory[categoryId] = mergeAmountMaps(fact.byCategory[categoryId] ?? {}, sumAmountMap(entry))

      const budgetId = split.budget_id ?? 'none'
      fact.byBudget[budgetId] = mergeAmountMaps(fact.byBudget[budgetId] ?? {}, sumAmountMap(entry))

      // Root-tag resolution is PER SPLIT (split.tags), not Transaction.getTags()'s group-level
      // union — that group-level union is what makes dashboardExpensesByTag double-count a
      // multi-split transaction. `tag.attributes.parent_id` is Firefly's real parent/child
      // tag relationship, not string parsing.
      const tags = (split.tags ?? []).filter(Boolean)
      const rootTag = tags.find((tag) => !tag?.attributes?.parent_id) ?? tags[0]
      const targetTags = tagsWidgetModeOnlyRootTag ? [rootTag].filter(Boolean) : tags
      const tagKeys = targetTags.length > 0 ? targetTags.map((tag) => tag.id) : ['none']
      for (const tagId of tagKeys) {
        fact.byTag[tagId] = mergeAmountMaps(fact.byTag[tagId] ?? {}, sumAmountMap(entry))
      }

      const merchantId = split.destination_id ?? 'none'
      fact.byMerchant[merchantId] ??= { amount: {}, count: 0 }
      fact.byMerchant[merchantId].amount = mergeAmountMaps(fact.byMerchant[merchantId].amount, sumAmountMap(entry))
      fact.byMerchant[merchantId].count += 1

      const weekday = getDay(split.date) // split.date is already a real Date post-transform
      fact.byWeekday[weekday] = mergeAmountMaps(fact.byWeekday[weekday], sumAmountMap(entry))
    }
  }
  return fact
}

// Not a real hash function — a canonicalized JSON.stringify. Collision risk is a non-issue
// at this cardinality, and this avoids a hashing dependency for zero benefit. Id arrays are
// sorted so re-ordering an excluded list without changing membership doesn't spuriously
// invalidate the cache.
export function factFilterHash({ firstDayOfMonth, excludedAccountIds = [], excludedCategoryIds = [], excludedTagIds = [], tagsWidgetModeOnlyRootTag, analyticsFilters = {} } = {}) {
  return JSON.stringify({
    v: ANALYTICS_SCHEMA_VERSION,
    firstDayOfMonth,
    excludedAccountIds: [...excludedAccountIds].sort(),
    excludedCategoryIds: [...excludedCategoryIds].sort(),
    excludedTagIds: [...excludedTagIds].sort(),
    tagsWidgetModeOnlyRootTag,
    // The analytics-only dimensional filter (categories/tags/accounts/budgets, Part 3) — a
    // change here must invalidate cached facts exactly like the persistent exclusion lists do.
    analyticsFilters: analyticsFilterHashPart(analyticsFilters),
  })
}

function analyticsFilterHashPart(analyticsFilters) {
  return Object.keys(analyticsFilters)
    .sort()
    .reduce((result, key) => {
      const { selected = [], mode } = analyticsFilters[key] ?? {}
      result[key] = { ids: selected.map((item) => item.id).sort(), mode }
      return result
    }, {})
}

// sortedIds: already descending by whatever ranking the caller computed (ranking with
// currency conversion needs useCurrencyStore(), so it can't live in this pure file).
export function assignColorSlots(sortedIds, maxSlots = ANALYTICS_CATEGORICAL_COLOR_SLOTS) {
  return sortedIds.reduce((map, id, index) => {
    map[id] = index < maxSlots ? index : 'other'
    return map
  }, {})
}

// totalsById: {[id]: amount}. Splits into the top N ids by amount (descending, tie-broken by id
// string for deterministic output) and everything else, pre-summed into otherTotal.
export function rankTopNWithOther(totalsById, n) {
  const sorted = Object.entries(totalsById ?? {}).sort(([idA, a], [idB, b]) => b - a || idA.localeCompare(idB))
  const topIds = sorted.slice(0, n).map(([id]) => id)
  const otherEntries = sorted.slice(n)
  const otherIds = otherEntries.map(([id]) => id)
  const otherTotal = otherEntries.reduce((sum, [, amount]) => sum + amount, 0)
  return { topIds, otherIds, otherTotal }
}

// valuesById: {[id]: signed number} (a delta or a slope, not a plain amount). Sibling to
// rankTopNWithOther, but ranks by |value| (a big decrease matters as much as a big increase)
// and sums (not just counts) the tail, since the tail's sign matters too.
export function rankTopNByMagnitudeWithOther(valuesById, n) {
  const sorted = Object.entries(valuesById ?? {}).sort(([idA, a], [idB, b]) => Math.abs(b) - Math.abs(a) || idA.localeCompare(idB))
  const topIds = sorted.slice(0, n).map(([id]) => id)
  const otherEntries = sorted.slice(n)
  const otherIds = otherEntries.map(([id]) => id)
  const otherValue = otherEntries.reduce((sum, [, value]) => sum + value, 0)
  return { topIds, otherIds, otherValue }
}

// xs = TRUE month index (not observed-position index — the exact bug the Streamlit build had:
// treating a tag's observed months as consecutive overstates the slope across gap months).
export function leastSquaresSlope(xs, ys) {
  if (!xs || !ys || xs.length !== ys.length || xs.length < 2) return null
  const n = xs.length
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n
  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY)
    denominator += (xs[i] - meanX) ** 2
  }
  if (denominator === 0) return null
  const slope = numerator / denominator
  return { slope, intercept: meanY - slope * meanX }
}

export function movingAverage(values, windowSize) {
  if (!values || windowSize < 1) return []
  return values.map((_, index) => {
    const windowStart = Math.max(0, index - windowSize + 1)
    const window = values.slice(windowStart, index + 1)
    return window.reduce((sum, value) => sum + value, 0) / window.length
  })
}

// Mirrors budget-icon.vue's existing (untouched) 4-bucket ramp — same thresholds, new home,
// since that component is explicitly off-limits to extend for analytics use (ANALYTICS_PLAN.md
// Part 1, line 111: "leave that component alone").
export function budgetSeverity(percent) {
  if (percent == null) return null
  if (percent < 50) return 'good'
  if (percent < 70) return 'warning'
  if (percent < 90) return 'serious'
  return 'critical'
}

export function median(values) {
  if (!values || values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// counts[0..6] = how many times that calendar weekday (date-fns getDay(), 0=Sun..6=Sat) occurred
// between start/end inclusive — the divisor for "spend PER Monday", not "spend on Mondays total".
export function countWeekdayOccurrences(start, end) {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  if (!start || !end || end < start) return counts
  let cursor = start
  while (cursor <= end) {
    counts[getDay(cursor)] += 1
    cursor = addDays(cursor, 1)
  }
  return counts
}

// Tukey's method (uses the median() above for each half). Returns null below minSampleSize —
// too few points to split into a meaningful quartile pair, so callers must treat null as "no
// outlier isolation possible" rather than dividing by a zero/undefined iqr.
export function quartiles(values, minSampleSize = ANALYTICS_IQR_MIN_SAMPLE) {
  if (!values || values.length < minSampleSize) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const lower = sorted.slice(0, mid)
  const upper = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1)
  const q1 = median(lower)
  const q3 = median(upper)
  return { q1, q3, iqr: q3 - q1 }
}

// occurrencesByMerchant: {[merchantId]: [{monthKey, amount}, ...]} — the caller (analyticsStore)
// only includes months where that merchant had EXACTLY ONE split that month; a month where the
// same merchant billed more than once is ambiguous from a monthly aggregate alone and is omitted
// by the caller rather than guessed at here. Buckets each merchant's occurrences by rounded
// amount and flags a bucket as a recurring candidate once it has >= minMonths stable-amount hits.
export function detectRecurringCandidates(occurrencesByMerchant, { minMonths = ANALYTICS_RECURRING_MIN_MONTHS, toleranceRatio = ANALYTICS_RECURRING_AMOUNT_TOLERANCE } = {}) {
  const candidates = []
  for (const [merchantId, occurrences] of Object.entries(occurrencesByMerchant ?? {})) {
    if (!occurrences || occurrences.length < minMonths) continue

    const buckets = new Map() // roundedAmount -> occurrences
    for (const occurrence of occurrences) {
      const key = Math.round(occurrence.amount)
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(occurrence)
    }

    for (const bucketOccurrences of buckets.values()) {
      if (bucketOccurrences.length < minMonths) continue
      const amounts = bucketOccurrences.map((occurrence) => occurrence.amount)
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      if (averageAmount === 0) continue
      const maxDeviation = Math.max(...amounts.map((amount) => Math.abs(amount - averageAmount) / averageAmount))
      if (maxDeviation > toleranceRatio) continue
      candidates.push({
        merchantId,
        occurrenceCount: bucketOccurrences.length,
        averageAmount,
        monthKeys: bucketOccurrences.map((occurrence) => occurrence.monthKey),
      })
    }
  }
  return candidates
}
