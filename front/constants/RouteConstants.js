export default {
  ROUTE_HOME: '/',
  ROUTE_TRANSACTION_LIST: '/transactions/list',
  ROUTE_TRANSACTION_ID: '/transactions',
  ROUTE_CALENDAR: '/calendar',
  ROUTE_EXTRAS: '/extras',
  ROUTE_DASHBOARD: '/dashboard',

  ROUTE_SETTINGS: '/settings',
  ROUTE_SETTINGS_APP_CONFIG: '/settings/app-config',
  ROUTE_SETTINGS_USER_PREFERENCES_DATE: '/settings/user-preferences-date',
  ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTIONS: '/settings/user-preferences-transactions',
  ROUTE_SETTINGS_USER_PREFERENCES_QUICK_AMOUNTS: '/settings/user-preferences-quick-transaction-amounts',
  ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTION_FIELDS_ORDER: '/settings/user-preferences-transaction-fields-order',
  ROUTE_SETTINGS_NEW_TRANSACTION_DEFAULTS: '/settings/user-preferences-new-transaction-defaults',
  ROUTE_SETTINGS_USER_PREFERENCES_UI: '/settings/user-preferences-ui',
  ROUTE_SETTINGS_USER_PREFERENCES_DASHBOARD: '/settings/user-preferences-dashboard',
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

  ROUTE_APP_SETTINGS: '/app_settings',

  isForm(routeForm, currentForm) {
    let regex = new RegExp(`${routeForm}/[0-9]+`)
    return regex.test(currentForm)
  },
}
