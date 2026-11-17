<template>
  <div :class="themeClass">
    <NuxtPwaManifest />
    <component :is="shell" />
  </div>
</template>

<script setup>
import { useDashboardStore } from '~/core/stores/dashboardStore'
import RouteConstants from '~/core/constants/RouteConstants'
import { isDesktopUI } from '~/core/utils/UIModeUtils'

const shell = defineAsyncComponent(isDesktopUI ? () => import('~/desktop/desktop-app.vue') : () => import('~/mobile/mobile-app.vue'))

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()
const appStore = useAppStore()

// theme-dark is the dark-mode hook for the desktop tokens and Tailwind's dark: variant
const themeClass = computed(() => ({ 'theme-dark': profileStore.darkTheme }))
const pwaColor = computed(() => (profileStore.darkTheme ? '#1c1c1e' : '#ffffff'))
useHead({
  meta: [{ name: 'theme-color', content: pwaColor }],
})

onMounted(async () => {
  // Before the token check: after a first setup the dashboard opens without a reload
  await dashboardStore.init()
  if (!appStore.authToken) {
    navigateTo(`${RouteConstants.ROUTE_SETTINGS_SETUP}`)
    return
  }

  appStore.fetchInfo()
  await profileStore.getProfiles({ showLoading: false })
  await appStore.syncEverythingIfOld()
  useTodoStore().fetchTodoOnce()
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
