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

let dataStore = useDataStore()
let profileStore = useProfileStore()
let appStore = useAppStore()

const theme = computed(() => (profileStore.darkTheme ? 'dark' : 'white'))

onMounted(async () => {
  if (!profileStore.authToken) {
    navigateTo(`${RouteConstants.ROUTE_SETTINGS_APP_CONFIG}`)
    return
  }

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
