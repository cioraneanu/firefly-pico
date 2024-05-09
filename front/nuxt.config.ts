// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
import pkg from './package.json'

const appName = 'Firefly Pico'
const appDescription = 'Firefly III companian app.'
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      version: pkg.version,
      // mihai: 'test'
    },
  },
  devServer: {
    // host: '192.168.1.10'
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
        "@/assets/styles/bootstrap.min.css",
        "@/assets/styles/theme.css",
        "@/assets/styles/helper.css"
    ],
    build: {
        // transpile: ['vuetify'],
    },
    modules: [
        // '@vite-pwa/nuxt',
        '@nuxtjs/device',
        '@pinia/nuxt',
        '@vant/nuxt',
        'nuxt-svgo',
        '@nuxt/eslint',
    ],

  svgo: {
    defaultImport: 'component',
    autoImportPath: './assets/icons',
    // autoImportPath: './assets/icons/duotone-line',
    // global: true,
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Pico',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    },
  },
  // pwa: {
  //     scope: '/',
  //     base: '/',
  //     injectRegister: 'auto',
  //     registerType: 'autoUpdate',
  //     manifest: {
  //         name: appName,
  //         short_name: appName,
  //         description: appDescription,
  //         theme_color: "#1867c0",
  //         background_color: "#1867c0",
  //         icons: [
  //             {
  //                 src: 'pwa-64x64.png',
  //                 sizes: '64x64',
  //                 type: 'image/png'
  //             },
  //             {
  //                 src: 'pwa-192x192.png',
  //                 sizes: '192x192',
  //                 type: 'image/png'
  //             },
  //             {
  //                 src: 'pwa-512x512.png',
  //                 sizes: '512x512',
  //                 type: 'image/png',
  //                 purpose: 'any'
  //             },
  //             {
  //                 src: 'maskable-icon-512x512.png',
  //                 sizes: '512x512',
  //                 type: 'image/png',
  //                 purpose: 'maskable'
  //             }
  //         ]
  //     },
  //     registerWebManifestInRouteRules: true,
  //     workbox: {
  //         navigateFallback: undefined,
  //         cleanupOutdatedCaches: true,
  //         globPatterns: ['**/*.{json,ico,svg,ttf,woff,css,scss,js,html,txt,jpg,png,woff2,mjs,otf,ani}'],
  //         runtimeCaching: [
  //             {
  //                 urlPattern: "/",
  //                 handler: 'NetworkFirst',
  //             },
  //             // {
  //             //     urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
  //             //     handler: "CacheFirst",
  //             //     options: {
  //             //         cacheName: "mapbox-cache",
  //             //         cacheableResponse: {
  //             //             statuses: [0, 200],
  //             //         },
  //             //     },
  //             // },
  //         ],
  //     },
  //     client: {
  //         installPrompt: false,
  //         periodicSyncForUpdates: 20, //seconds
  //     },
  //     devOptions: {
  //         enabled: true,
  //         suppressWarnings: false,
  //         navigateFallback: 'index.html',
  //         type: 'module',
  //     },
  // },
})
