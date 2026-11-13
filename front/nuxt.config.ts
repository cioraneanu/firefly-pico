// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
import pkg from './package.json'
import { supportedLanguages } from './i18n'
import tailwindcss from '@tailwindcss/vite'

const appName = 'Firefly Pico'
const appDescription = 'Firefly III companion app.'
export default defineNuxtConfig({
  devServer: {
    // host: '192.168.1.213',
    // host: '0'
  },
  i18n: {
    vueI18n: './i18n/i18n.config.js',
    langDir: 'locales',
    locales: supportedLanguages,
    defaultLocale: 'en',
    lazy: true,
    strategy: 'no_prefix',
    compilation: {
      strictMessage: false,
    },
  },

  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
  },
  runtimeConfig: {
    public: {
      version: process.env.NUXT_PUBLIC_VERSION ?? pkg.version,
      queryTimeout: 8000,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    vue: {
      script: {
        defineModel: true,
        // propsDestructure: true
      },
    },
  },

  devtools: {
    enabled: false,
  },

  ssr: false,

  dir: {
    app: '.',
    pages: 'mobile/pages',
    layouts: 'mobile/layouts',
  },

  imports: {
    dirs: ['core/composables', 'core/utils', 'mobile/composables', 'desktop/composables'],
  },

  pinia: {
    storesDirs: ['core/stores'],
  },

  components: [
    {
      path: '~/shared/components',
      pathPrefix: false,
    },
    {
      path: '~/desktop/components',
      prefix: 'D',
      pathPrefix: false,
    },
    {
      path: '~/mobile/components',
      pathPrefix: false,
    },
  ],

  css: [
    '~/assets/styles/tailwind.css',
    '~/assets/styles/animations.css',
    '~/mobile/styles/mx.css',
    '~/mobile/styles/mx-app-kit.css',
    '~/mobile/styles/mx-app-tx.css',
    '~/mobile/styles/mx-app-dash.css',
    '~/mobile/styles/mx-app-entities.css',
  ],

  build: {
    // transpile: ['vuetify'],
  },

  modules: ['@vite-pwa/nuxt', '@nuxtjs/device', '@pinia/nuxt', 'nuxt-svgo', '@nuxt/eslint', '@nuxtjs/i18n'],

  svgo: {
    defaultImport: 'component',
    autoImportPath: './assets/icons',
    // autoImportPath: './assets/icons/duotone-line',
    // global: true,
  },
  app: {
    // pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Pico',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#4A3ED0' },
      ],
      meta: [{ name: 'msapplication-TileColor', content: '#4A3ED0' }],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Pico',
      short_name: 'Pico',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['fonts/*.woff2'],
      runtimeCaching: [
        {
          // Admin custom icons. The backend may be on another origin => also cache opaque responses (status 0)
          urlPattern: ({ url }) => url.pathname.includes('/api/custom-icons/'),
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'custom-icons',
            cacheableResponse: { statuses: [0, 200] },
            expiration: { maxEntries: 500 },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },
  compatibilityDate: '2024-07-26',
})
