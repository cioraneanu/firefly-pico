import { useI18n } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  // const { setLocale } = useI18n()

  watch(
    () => useProfileStore().language,
    (newValue) => {
      console.log('watch plugin,', { newValue })
      // setLocale(newValue)
    },
    { immediate: true },
  )
})
