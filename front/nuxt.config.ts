// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
import pkg from './package.json'
import { supportedLanguages } from './i18n'

const appName = 'Firefly Pico'
const appDescription = 'Firefly III companion app.'
export default defineNuxtConfig({

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
      version: pkg.version,
      queryTimeout: 4000,
      // mihai: 'test'
    },
  },

  devServer: {
    // host: '192.168.1.10',
    // host: '0'
  },

  vite: {
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

  // components: {},
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
    {
      path: '~/components/global',
      global: true,
    },
  ],

  css: [
    '@/assets/styles/bootstrap.min.css',
    '@/assets/styles/variables.css',
    '@/assets/styles/theme.css',
    '@/assets/styles/theme-dark.css',
    '@/assets/styles/helper.css',
    '@/assets/styles/animations.css',
  ],

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
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },
  compatibilityDate: '2024-07-26',
})
