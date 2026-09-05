import { get } from 'lodash-es'
import { ANALYTICS_MAX_FANOUT_COMBOS } from '~/constants/AnalyticsConstants'

// A wholly separate mechanism from TransactionFilterUtils.js — that file's bagKey shapes are
// single-value and load-bearing for the transaction list and dashboard filter. Overloading them
// to arrays here would risk regressing those pages. See ANALYTICS_PLAN.md Part 3.
//
// Deliberately Vue/Pinia-free (no Category/Tag/Budget/Account model imports, which transitively
// pull in their Repository -> axios -> useAppStore chains, same reasoning as AnalyticsUtils.js
// avoiding the Transaction model) — display names are read directly via the same attribute paths
// those models' own getDisplayName() use (Tag is the one exception: attributes.tag, not
// attributes.name). URL persistence, which genuinely needs store dictionaries for fromUrl, lives
// in useAnalyticsFilters.js instead — mirroring how useAnalyticsRange.js keeps its own
// rangeFilterDefinitions inline rather than in DateRangeUtils.js.

export const analyticsFilterModes = {
  include: 'include',
  exclude: 'exclude',
}

// idBased dimensions (account) have a proven comma-list inclusion field (account_id:"1,2,3").
// Name-based dimensions (category/tag/budget) do not — no proof Firefly ORs repeated/comma-listed
// values on category_is/tag_is/budget_is, so 2+ included values fan out into one sub-request per
// value instead of gambling on an unverified query fragment.
export const analyticsFilterDimensions = {
  category: {
    bagKey: 'category',
    queryField: 'category_is',
    idBased: false,
    getDisplayName: (item) => get(item, 'attributes.name'),
    getId: (item) => item.id,
  },
  tag: {
    bagKey: 'tag',
    queryField: 'tag_is',
    idBased: false,
    getDisplayName: (item) => get(item, 'attributes.tag') ?? '',
    getId: (item) => item.id,
  },
  budget: {
    bagKey: 'budget',
    queryField: 'budget_is',
    idBased: false,
    getDisplayName: (item) => get(item, 'attributes.name'),
    getId: (item) => item.id,
  },
  account: {
    bagKey: 'account',
    queryField: 'account_id',
    idBased: true,
    getDisplayName: (item) => get(item, 'attributes.name'),
    getId: (item) => item.id,
  },
}

export const analyticsFilterDimensionKeys = Object.keys(analyticsFilterDimensions)

// Returns:
//  - fragments: query fragments that AND safely into the shared filtersParts (excludes of any
//    count, id-based includes of any count, name-based includes of 0-1 items)
//  - fanOutValues: null, OR one query-fragment PER selected value when a name-based dimension has
//    2+ included values — the caller must fan out one sub-request per value and merge+dedupe.
export function buildDimensionQuery(dimensionKey, selected, mode) {
  const config = analyticsFilterDimensions[dimensionKey]
  const items = selected ?? []
  if (items.length === 0) return { fragments: [], fanOutValues: null }

  if (mode === analyticsFilterModes.exclude) {
    // Proven-safe: repeated negation clauses AND together, mirrors getExcludedTransactionFilters().
    const fragmentValue = (item) => (config.idBased ? config.getId(item) : config.getDisplayName(item))
    return { fragments: items.map((item) => `-${config.queryField}:"${fragmentValue(item)}"`), fanOutValues: null }
  }

  // include mode
  if (config.idBased) {
    // Proven-safe: shipped comma-list inclusion (TransactionFilterUtils.filters.account).
    return { fragments: [`${config.queryField}:"${items.map((item) => config.getId(item)).join(',')}"`], fanOutValues: null }
  }

  if (items.length === 1) {
    return { fragments: [`${config.queryField}:"${config.getDisplayName(items[0])}"`], fanOutValues: null }
  }

  return { fragments: [], fanOutValues: items.map((item) => `${config.queryField}:"${config.getDisplayName(item)}"`) }
}

// filterState: { category: {selected, mode}, tag: {...}, budget: {...}, account: {...} }
export function buildAnalyticsFilterPlan(filterState) {
  const simpleFragments = []
  const fanOutGroups = []
  for (const dimensionKey of analyticsFilterDimensionKeys) {
    const { selected, mode } = filterState?.[dimensionKey] ?? {}
    const { fragments, fanOutValues } = buildDimensionQuery(dimensionKey, selected, mode)
    simpleFragments.push(...fragments)
    if (fanOutValues) fanOutGroups.push({ dimension: dimensionKey, values: fanOutValues })
  }
  return { simpleFragments, fanOutGroups }
}

// Firefly's `{field}_is`/`-{field}_is` query operators match at the TRANSACTION-GROUP level
// (confirmed against OperatorQuerySearch.php's GroupCollector::setBudget()/setCategory() calls) —
// once ANY split/journal in a group matches, the API returns the WHOLE group, every split,
// including siblings that don't themselves satisfy the filter (e.g. a multi-line purchase split
// across two different budgets, only one of which was selected). buildMonthlyFact must re-check
// each split against the SAME active filter before attributing it to a by* breakdown map, or a
// sibling split leaks in under the wrong (or no) budget/category/tag/account. Deliberately
// id-based, not name-based like the query-fragment builders above — a split's own category_id/
// budget_id/tags/source_id/destination_id are already raw ids, no display-name matching needed.
function splitFieldIds(split, dimensionKey) {
  switch (dimensionKey) {
    case 'category':
      return split.category_id != null ? [String(split.category_id)] : []
    case 'budget':
      return split.budget_id != null ? [String(split.budget_id)] : []
    case 'tag':
      return (split.tags ?? []).filter(Boolean).map((tag) => String(tag.id))
    case 'account':
      return [split.source_id, split.destination_id].filter((id) => id != null).map(String)
    default:
      return []
  }
}

// filterState: same shape as buildAnalyticsFilterPlan's param. AND across dimensions (matching
// Firefly's query-string AND-combination); within one dimension, include mode is OR across
// selected values, exclude mode is AND-NOT across them — same semantics buildDimensionQuery's
// fragments already express server-side, just re-applied per split rather than per group.
export function splitMatchesAnalyticsFilters(split, filterState) {
  for (const dimensionKey of analyticsFilterDimensionKeys) {
    const { selected, mode } = filterState?.[dimensionKey] ?? {}
    if (!selected || selected.length === 0) continue
    const selectedIds = new Set(selected.map((item) => String(item.id)))
    const splitIds = splitFieldIds(split, dimensionKey)
    const intersects = splitIds.some((id) => selectedIds.has(id))
    if (mode === analyticsFilterModes.exclude ? intersects : !intersects) return false
  }
  return true
}

// Cartesian product across fan-out dimensions — each combo is an array of query fragments (one per
// fan-out dimension) to AND together alongside simpleFragments for one sub-request.
export function expandFanOutCombos(fanOutGroups) {
  if (!fanOutGroups || fanOutGroups.length === 0) return [[]]
  return fanOutGroups.reduce((combos, group) => combos.flatMap((combo) => group.values.map((value) => [...combo, value])), [[]])
}

export function fanOutComboCount(fanOutGroups) {
  if (!fanOutGroups || fanOutGroups.length === 0) return 1
  return fanOutGroups.reduce((count, group) => count * group.values.length, 1)
}

export function exceedsFanOutCap(fanOutGroups, cap = ANALYTICS_MAX_FANOUT_COMBOS) {
  return fanOutComboCount(fanOutGroups) > cap
}
