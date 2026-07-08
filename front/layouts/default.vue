<template>
  <div :class="layoutClass">
    <template v-if="appStore.isDesktopLayout">
      <div class="display-flex gap-3">
        <app-left-sidebar />
        <div class="desktop-content">
          <slot />
        </div>
      </div>
    </template>

    <template v-else>
      <slot />
      <app-bottom-toolbar />
    </template>

    <profile-picker-float v-if="profileStore.dashboard.isProfileFloatVisible && !appStore.isDesktopLayout" />
    <app-bottom-loading />
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import { useProfileStore } from '~/stores/profileStore'

const device = useDevice()
const appStore = useAppStore()
const profileStore = useProfileStore()

const layoutClass = computed(() => {
  return {
    layout: true,
    'layout-desktop': appStore.isDesktopLayout,
    'layout-mobile': !appStore.isDesktopLayout,
    // desktop: device.isDesktop,
    // mobile: device.isMobile,
  }
})

// const isProfileFloatButtonVisible = computed(() => {
//   let route = useRoute()
//   return RouteConstants.isSettings(route.path) || route.path === RouteConstants.ROUTE_TRANSACTION_ID
// })
</script>
