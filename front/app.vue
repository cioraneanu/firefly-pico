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
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=pocket-sprite' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=pocket-sprite' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png?v=pocket-sprite' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=pocket-sprite' },
    { rel: 'mask-icon', href: '/safari-pinned-tab.svg?v=pocket-sprite', color: '#00a261' },
  ],
})

useResize()

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
