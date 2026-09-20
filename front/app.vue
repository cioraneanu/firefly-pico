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
import { useDocumentVisibility } from '@vueuse/core'
import { useDashboardStore } from '~/stores/dashboardStore'
import RouteConstants from '~/constants/RouteConstants'

import '~/assets/styles/variables.css'
import AppLoading from '~/components/ui-kit/app-loading.vue'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()
const appStore = useAppStore()

const theme = computed(() => (profileStore.darkTheme ? 'dark' : 'white'))
const pwaColor = computed(() => (profileStore.darkTheme ? '#1c1c1e' : '#ffffff'))
useHead({
  meta: [{ name: 'theme-color', content: pwaColor }],
})

useResize()

const documentVisibility = useDocumentVisibility()

// Changes made in Firefly III, the importer or a rule cannot reach us any other way, and
// asking costs almost nothing when nothing changed.
watch(documentVisibility, (visibility) => {
  if (visibility === 'visible' && appStore.authToken) {
    appStore.syncEverythingIfStale()
  }
})

onMounted(async () => {
  if (!appStore.authToken) {
    navigateTo(`${RouteConstants.ROUTE_SETTINGS_SETUP}`)
    return
  }
  await dashboardStore.init()

  appStore.fetchInfo()
  await profileStore.getProfiles({ showLoading: false })
  await appStore.syncEverythingIfOld()
})
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
