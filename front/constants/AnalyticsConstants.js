export const ANALYTICS_SCHEMA_VERSION = 1

export const ANALYTICS_PAGE_SIZE = 250
export const ANALYTICS_FETCH_CONCURRENCY = 4
export const ANALYTICS_FETCH_TIMEOUT_MS = 15000 // > backend's own 10s cap, deliberately — see analyticsStore
export const ANALYTICS_BACKEND_CAP_MS = 10000 // BaseControllerFirefly.php:50 — measurement-flagging only
export const ANALYTICS_CURRENT_MONTH_CACHE_TTL_MS = 5 * 60 * 1000 // 5 min — CURRENT financial month only

// Filter-driven fan-out (multi-include category/tag/budget) is a THIRD nested concurrency layer on
// top of month-fan-out x page-fan-out (already 4x4=16 in flight). Deliberately its own, smaller
// constant — reusing ANALYTICS_FETCH_CONCURRENCY here would let a 3-combo selection hit 48+ in flight.
export const ANALYTICS_SUBQUERY_CONCURRENCY = 2
// Total sub-request combinations (Cartesian product across fan-out dimensions) allowed per month
// before the filter UI must warn instead of silently multiplying request count.
export const ANALYTICS_MAX_FANOUT_COMBOS = 12

export const ANALYTICS_CATEGORICAL_COLOR_SLOTS = 8 // palette: categorical series cap at 8 + "Other"

// Three similarly-shaped-but-distinct caps, each answering a different question — do not
// collapse into one shared constant:
//   ANALYTICS_CATEGORICAL_COLOR_SLOTS (above) — how many distinct HUES the palette has
//   ANALYTICS_RANKED_TOP_N             — how many ROWS the single-hue ranked-bars list shows
//   ANALYTICS_COMPOSITION_TOP_N        — how many STACK SEGMENTS the composition chart shows
export const ANALYTICS_RANKED_TOP_N = 10
export const ANALYTICS_COMPOSITION_TOP_N = 7 // matches ANALYTICS_PLAN.md Part 1/2's "top 7 + Other"

export const analyticsTab = {
  headline: { t: 'analytics.tab.headline', code: 'headline', needs: ['monthlyFacts'] },
  cashflow: { t: 'analytics.tab.cashflow', code: 'cashflow', needs: ['monthlyFacts'] },
  whereMoneyGoes: { t: 'analytics.tab.where_money_goes', code: 'whereMoneyGoes', needs: ['monthlyFacts'] },
  budgets: { t: 'analytics.tab.budgets', code: 'budgets', needs: ['monthlyFacts'] },
  behavior: { t: 'analytics.tab.behavior', code: 'behavior', needs: ['monthlyFacts'] },
  netWorth: { t: 'analytics.tab.net_worth', code: 'netWorth', needs: ['accounts'] },
}
export const analyticsTabList = Object.values(analyticsTab)
