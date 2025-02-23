import { setDefaultOptions } from 'date-fns'

export default defineNuxtPlugin((nuxtApp) => {
  watch(
    () => useProfileStore().weekStartsOn,
    (newValue) => {
      setDefaultOptions({ weekStartsOn: newValue })
    },
    { immediate: true },
  )
})
