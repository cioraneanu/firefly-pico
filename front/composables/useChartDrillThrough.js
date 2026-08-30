import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils'

// Shared drill-through for the analytics "Where the money goes" charts (ranked bars,
// composition-over-time) and any later Phase 3c mark that filters by category/tag over a date
// range. byCategory/byTag are expense-only in MonthlyFact's v1 scope (ANALYTICS_PLAN.md Part 3),
// so the transaction type filter is always applied unconditionally — there's no net-amount-mode
// toggle to condition on, since income was never attributed to a category at all.
const dimensionFilters = {
  byCategory: { forId: TransactionFilterUtils.filters.category, forNone: TransactionFilterUtils.filters.noCategory },
  byTag: { forId: TransactionFilterUtils.filters.tag, forNone: TransactionFilterUtils.filters.noTag },
}

export const useChartDrillThrough = () => {
  // id === null/undefined => no safe query fragment exists for "everything except these N
  // categories" (ANALYTICS_PLAN.md Part 7) — this is how the "Other" bucket's marks are made
  // deliberately non-clickable: callers should simply not wire a click handler when id is nullish,
  // but urlFor()/navigate() also no-op defensively rather than emitting a wrong/misleading filter.
  function urlFor({ start, end, dimension, id }) {
    if (id === null || id === undefined) return null
    const dim = dimensionFilters[dimension]
    if (!dim) return null

    const filters = [TransactionFilterUtils.filters.dateAfter.toUrl(start), TransactionFilterUtils.filters.dateBefore.toUrl(end)]
    filters.push(id === 'none' ? dim.forNone.toUrl() : dim.forId.toUrl({ id }))
    filters.push(TransactionFilterUtils.filters.transactionType.toUrl(Transaction.types.expense))

    return `${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters.join('&')}${getExcludedTransactionUrl()}`
  }

  async function navigate({ start, end, dimension, id }) {
    const url = urlFor({ start, end, dimension, id })
    if (!url) return
    await navigateTo(url)
  }

  return { urlFor, navigate }
}
