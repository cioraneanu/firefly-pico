import { setDefaultOptions } from 'date-fns'
import { ro, enUS, zhCN } from 'date-fns/locale'
import { languageCode } from '~/i18n/index.js'

export default defineNuxtPlugin((nuxtApp) => {
  watch(
    () => useProfileStore().weekStartsOn,
    (newValue) => {
      setDefaultOptions({ weekStartsOn: newValue })
    },
    { immediate: true },
  )

  watch(
    () => useProfileStore().language,
    (newValue) => {
      const dateFnsLocaleDictionary = {
        [languageCode.en]: enUS,
        [languageCode.ro]: ro,
        [languageCode.zhCn]: zhCN,
      }
      let dateFnsLocale = dateFnsLocaleDictionary[newValue] || enUS

      setDefaultOptions({ locale: dateFnsLocale })
    },
    { immediate: true },
  )
})
