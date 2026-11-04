import sections from './settings-sections'

const settings = () => import('./pages/settings.vue')

const settingsRedirects = {
  '/settings': 'connection',
  '/settings/setup': 'connection',
  '/settings/enabled-resources': 'connection',
  '/settings/ui': 'appearance',
  '/settings/formatting': 'appearance',
  '/settings/dashboard/cards': 'dashboard',
  '/settings/transactions': 'transaction-defaults',
  '/settings/transactions/default-form-values': 'transaction-defaults',
  '/settings/transactions/default-list-filters': 'transaction-defaults',
  '/settings/transactions/quick-amounts': 'transaction-defaults',
  '/settings/transactions/form-fields': 'transaction-fields',
  '/settings/transactions/list-fields': 'transaction-fields',
}

// Opening or closing a route dialog (/transactions/list ↔ /transactions/42) stays on the same page, so keep its scroll position
const scrollToTop = (to, from) => to.matched[0]?.path !== from.matched[0]?.path

export default [
  ...sections.map((section) => ({ path: `/settings/${section.code}`, component: settings, meta: { section: section.code, crumb: section.t } })),
  ...Object.entries(settingsRedirects).map(([path, code]) => ({ path, redirect: `/settings/${code}` })),
  { path: '/', component: () => import('./pages/index.vue') },
  { path: '/dashboard', component: () => import('./pages/dashboard.vue') },
  { path: '/transactions/:id?', component: () => import('./pages/transactions.vue') },
  { path: '/ramble', component: () => import('./pages/ramble.vue'), meta: { crumb: 'transaction.assistant_ramble_title' } },
  { path: '/accounts/:id?', component: () => import('./pages/accounts.vue') },
  { path: '/budgets/:id?', component: () => import('./pages/budgets.vue') },
  { path: '/piggy-banks/:id?', component: () => import('./pages/piggy-banks.vue') },
  { path: '/transaction-templates/:id?', component: () => import('./pages/templates.vue') },
  { path: '/recurring-transactions/:id?', component: () => import('./pages/recurring.vue') },
  { path: '/categories/:id?', component: () => import('./pages/categories.vue') },
  { path: '/tags/:id?', component: () => import('./pages/tags.vue') },
  { path: '/currencies/:id?', component: () => import('./pages/currencies.vue') },
  { path: '/exchange-rates', component: () => import('./pages/exchange-rates.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
].map((route) => ({ ...route, meta: { scrollToTop, ...route.meta } }))
