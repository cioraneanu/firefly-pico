export default [
  { path: '/', component: () => import('./pages/index.vue') },
  { path: '/dashboard', component: () => import('./pages/dashboard.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]
