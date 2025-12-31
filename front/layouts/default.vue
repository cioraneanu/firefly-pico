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

    <profile-picker-float v-if="true" />
    <app-bottom-loading />
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'

const device = useDevice()
const appStore = useAppStore()

const layoutClass = computed(() => {
  return {
    layout: true,
    desktop: device.isDesktop,
    mobile: device.isMobile,
  }
})

// const isProfileFloatButtonVisible = computed(() => {
//   let route = useRoute()
//   return RouteConstants.isSettings(route.path) || route.path === RouteConstants.ROUTE_TRANSACTION_ID
// })
</script>
