export default defineNuxtConfig({
  buildDir: '.docus-build',
  ui: { fonts: false },
  ogImage: { enabled: false },
  vite: { cacheDir: '.nuxt/vite-cache' },
  nitro: {
    prerender: {
      routes: ['/introduction'],
      failOnError: true,
    },
  },
  site: {
    name: 'Firefly Pico · Developer guide',
  },
  routeRules: {
    '/': { redirect: '/introduction' },
  },
})
