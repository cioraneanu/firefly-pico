export default [
  { path: '/', component: () => import('./pages/index.vue') },
  { path: '/dashboard', component: () => import('./pages/dashboard.vue') },
  { path: '/categories/:id?', component: () => import('./pages/categories.vue') },
  { path: '/tags/:id?', component: () => import('./pages/tags.vue') },
  { path: '/currencies/:id?', component: () => import('./pages/currencies.vue') },
  { path: '/exchange-rates', component: () => import('./pages/exchange-rates.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]
