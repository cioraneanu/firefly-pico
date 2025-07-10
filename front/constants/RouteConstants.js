export default {
  ROUTE_HOME: '/',
  ROUTE_TRANSACTION_LIST: '/transactions/list',
  ROUTE_TRANSACTION_ID: '/transactions',
  ROUTE_CALENDAR: '/calendar',
  ROUTE_EXTRAS: '/extras',
  ROUTE_DASHBOARD: '/dashboard',

  ROUTE_SETTINGS: '/settings',
  ROUTE_SETTINGS_SETUP: '/settings/setup',
  ROUTE_SETTINGS_UI: '/settings/ui',
  ROUTE_SETTINGS_ASSISTANT: '/settings/assistant',
  ROUTE_SETTINGS_FORMATTING: '/settings/formatting',
  ROUTE_SETTINGS_DASHBOARD: '/settings/dashboard',
  ROUTE_SETTINGS_DASHBOARD_CARDS_ORDER: '/settings/dashboard/cards',
  ROUTE_SETTINGS_TRANSACTION: '/settings/transactions',
  ROUTE_SETTINGS_TRANSACTION_FORM_FIELDS: '/settings/transactions/form-fields',
  ROUTE_SETTINGS_TRANSACTION_LIST_FIELDS: '/settings/transactions/list-fields',
  ROUTE_SETTINGS_TRANSACTION_DEFAULT_FORM_VALUES: '/settings/transactions/default-form-values',
  ROUTE_SETTINGS_TRANSACTION_DEFAULT_LIST_FILTERS: '/settings/transactions/default-list-filters',
  ROUTE_SETTINGS_TRANSACTION_QUICK_AMOUNTS: '/settings/transactions/quick-amounts',
  ROUTE_SETTINGS_ABOUT: '/settings/about',

  ROUTE_EXCHANGE_RATES: '/exchange-rates',

  ROUTE_TRANSACTION_TEMPLATE_LIST: '/transaction-templates/list',
  ROUTE_TRANSACTION_TEMPLATE_ID: '/transaction-templates',

  ROUTE_ACCOUNT_LIST: '/accounts/list',
  ROUTE_ACCOUNT_ID: '/accounts',

  ROUTE_CATEGORY_LIST: '/categories/list',
  ROUTE_CATEGORY_ID: '/categories',

  ROUTE_TAG_LIST: '/tags/list',
  ROUTE_TAG_ID: '/tags',

  ROUTE_CURRENCY_LIST: '/currencies/list',
  ROUTE_CURRENCY_ID: '/currencies',

  ROUTE_BUDGET_LIST: '/budgets/list',
  ROUTE_BUDGET_ID: '/budgets',

  isForm(routeForm, currentForm) {
    let regex = new RegExp(`${routeForm}/[0-9]+`)
    return regex.test(currentForm)
  },

  isSettings(route) {
    let regex = new RegExp(`^/settings(.)*`)
    return regex.test(route)
  },
}
