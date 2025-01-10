<template>
  <van-config-provider :theme="theme">
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <app-loading />
  </van-config-provider>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import RouteConstants from '~/constants/RouteConstants'

import '~/assets/styles/variables.css'
import AppLoading from '~/components/ui-kit/app-loading.vue'
import profile from '~/models/Profile.js'
import { setDefaultOptions } from 'date-fns'

let dataStore = useDataStore()
let profileStore = useProfileStore()
let appStore = useAppStore()

const theme = computed(() => (profileStore.darkTheme ? 'dark' : 'white'))
const pwaColor = computed(() => (profileStore.darkTheme ? '#1c1c1e' : '#ffffff'))
useHead({
  meta: [{ name: 'theme-color', content: pwaColor }],
})

onMounted(async () => {
  if (!appStore.authToken) {
    navigateTo(`${RouteConstants.ROUTE_SETTINGS_SETUP}`)
    return
  }
  await dataStore.init()

  appStore.fetchLatestAppVersion()
  await profileStore.fetchProfile()
  await dataStore.syncEverythingIfOld()
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
