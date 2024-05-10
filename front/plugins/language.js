import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'

Locale.use('en-US', enUS)

import '@vant/touch-emulator'

export default defineNuxtPlugin((nuxtApp) => {
  // const vuetify = createVuetify({
  //     ssr: true,
  //     components,
  //     directives,
  // })
  //
  // nuxtApp.vueApp.use(vuetify)
})
