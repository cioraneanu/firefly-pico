// Vant theme related
import '@vant/touch-emulator'

// Vant locale related
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import ro from 'vant/es/locale/lang/ro-RO'
import zhCN from 'vant/es/locale/lang/zh-CN'

import { languageCode } from '~/i18n/index.js'

export default defineNuxtPlugin((nuxtApp) => {
  watch(
    () => useProfileStore().language,
    (newValue) => {
      const localeDictionary = {
        [languageCode.en]: enUS,
        [languageCode.ro]: ro,
        [languageCode.zhCn]: zhCN,
      }
      let locale = localeDictionary[newValue] || enUS
      Locale.use(newValue, locale)
      console.log('vant', {newValue, locale})
    },
    { immediate: true },
  )
})
