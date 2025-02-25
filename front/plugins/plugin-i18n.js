import { useI18n } from '#imports'

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
