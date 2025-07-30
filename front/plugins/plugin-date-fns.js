import { setDefaultOptions } from 'date-fns'
import { ro, enUS, zhCN, it, ptBR, deDE, deCH } from 'date-fns/locale'
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
        [languageCode.english]: enUS,
        [languageCode.romanian]: ro,
        [languageCode.chinese]: zhCN,
        [languageCode.italian]: it,
        [languageCode.brazilian_portuguese]: ptBR,
        [languageCode.german_german]: deDE,
        [languageCode.swiss_german]: deCH,
      }
      let dateFnsLocale = dateFnsLocaleDictionary[newValue] || enUS

      setDefaultOptions({ locale: dateFnsLocale })
    },
    { immediate: true },
  )
})
