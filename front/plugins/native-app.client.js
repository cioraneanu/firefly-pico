import { isNativeApp, postToNative } from '~/core/composables/useNativeApp.js'

// Inside the iOS app: hands it the backend URL and token whenever they change, so it can upload voice rambles on its own
export default defineNuxtPlugin(() => {
  if (!isNativeApp) return

  const appStore = useAppStore()
  watch(
    () => ({ picoBackendURL: appStore.picoBackendURL, authToken: appStore.authToken, picoBackendHeaders: appStore.picoBackendHeaders }),
    (session) => postToNative('session', JSON.parse(JSON.stringify(session))),
    { immediate: true, deep: true },
  )
})
