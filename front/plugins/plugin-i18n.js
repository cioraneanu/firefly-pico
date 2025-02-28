import { useI18n } from '#imports'
import { useNuxtApp } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  // const { setLocale } = useI18n()

  watch(
    () => useProfileStore().language,
    (newValue) => {
      nuxtApp.$i18n.setLocale(newValue)
    },
    { immediate: true },
  )
})


// Useful if we need translations in plain JS files (no components or composables)
export const translate = (key) => useNuxtApp()?.$i18n?.t(key)
