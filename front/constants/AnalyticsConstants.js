export const ANALYTICS_SCHEMA_VERSION = 1

export const ANALYTICS_PAGE_SIZE = 250
export const ANALYTICS_FETCH_CONCURRENCY = 4
export const ANALYTICS_FETCH_TIMEOUT_MS = 15000 // > backend's own 10s cap, deliberately — see analyticsStore
export const ANALYTICS_BACKEND_CAP_MS = 10000 // BaseControllerFirefly.php:50 — measurement-flagging only
export const ANALYTICS_CURRENT_MONTH_CACHE_TTL_MS = 5 * 60 * 1000 // 5 min — CURRENT financial month only

export const ANALYTICS_CATEGORICAL_COLOR_SLOTS = 8 // palette: categorical series cap at 8 + "Other"

export const analyticsTab = {
  headline: { t: 'analytics.tab.headline', code: 'headline', needs: ['monthlyFacts'] },
  cashflow: { t: 'analytics.tab.cashflow', code: 'cashflow', needs: ['monthlyFacts'] },
  whereMoneyGoes: { t: 'analytics.tab.where_money_goes', code: 'whereMoneyGoes', needs: ['monthlyFacts'] },
  budgets: { t: 'analytics.tab.budgets', code: 'budgets', needs: ['monthlyFacts'] },
  behavior: { t: 'analytics.tab.behavior', code: 'behavior', needs: ['monthlyFacts'] },
  netWorth: { t: 'analytics.tab.net_worth', code: 'netWorth', needs: ['accounts'] },
}
export const analyticsTabList = Object.values(analyticsTab)
