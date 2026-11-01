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
    pages: 'mobile/pages',
    layouts: 'mobile/layouts',
  },

  imports: {
    dirs: ['core/composables', 'core/utils', 'mobile/composables'],
  },

  pinia: {
    storesDirs: ['core/stores'],
  },

  components: [
    {
      path: '~/mobile/components',
      pathPrefix: false,
    },
    {
      path: '~/mobile/components/global',
      global: true,
    },
  ],

  css: ['~/assets/styles/tailwind.css', '~/mobile/styles/variables.css', '~/mobile/styles/theme-white.css', '~/mobile/styles/theme-dark.css', '~/assets/styles/animations.css'],

  build: {
    // transpile: ['vuetify'],
  },

  modules: ['@vite-pwa/nuxt', '@nuxtjs/device', '@pinia/nuxt', '@vant/nuxt', 'nuxt-svgo', '@nuxt/eslint', '@nuxtjs/i18n'],

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
      ],
    },
    workbox: {
      navigateFallback: '/',
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
