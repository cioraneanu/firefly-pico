// Vant theme related
import '@vant/touch-emulator'

// Vant locale related
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import ro from 'vant/es/locale/lang/ro-RO'
import zhCN from 'vant/es/locale/lang/zh-CN'
import italian from 'vant/es/locale/lang/it-IT'
import ptBR from 'vant/es/locale/lang/pt-BR'
import deDE from 'vant/es/locale/lang/de-DE'

import { languageCode } from '~/i18n/index.js'

export default defineNuxtPlugin((nuxtApp) => {
  watch(
    () => useProfileStore().language,
    (newValue) => {
      const localeDictionary = {
        [languageCode.english]: enUS,
        [languageCode.romanian]: ro,
        [languageCode.chinese]: zhCN,
        [languageCode.italian]: italian,
        [languageCode.brazilian_portuguese]: ptBR,
        [languageCode.german_german]: deDE,
      }
      let locale = localeDictionary[newValue] || enUS
      Locale.use(newValue, locale)
    },
    { immediate: true },
  )
})
