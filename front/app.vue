<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script>
// import { Locale } from 'vant'
// import enUS from 'vant/es/locale/lang/en-US'
// setup() {
//   Locale.use('en-US', enUS);
//   return {}
// }
</script>

<script setup>
// Locale.use('en-US', enUS);
import { useDataStore } from '~/stores/dataStore'
import RouteConstants from '~/constants/RouteConstants'

let dataStore = useDataStore()
let appStore = useAppStore()

onMounted(async () => {
  if (!appStore.authToken) {
    navigateTo(`${RouteConstants.ROUTE_SETTINGS_APP_CONFIG}`)
    return
  }

  await dataStore.syncEverythingIfOld()
  await appStore.fetchLatestAppVersion()
})

const { isLoading } = storeToRefs(dataStore)
UIUtils.showLoadingWhen(isLoading)
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.15s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(0.2rem);
}
</style>
