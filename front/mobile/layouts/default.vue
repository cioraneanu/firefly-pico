<template>
  <div :class="layoutClass">
    <slot />
    <app-bottom-toolbar />

    <profile-picker-float v-if="profileStore.dashboard.isProfileFloatVisible" />
    <app-bottom-loading />
  </div>
</template>

import { ref } from 'vue';

<script setup>
import { useProfileStore } from '~/core/stores/profileStore'

const profileStore = useProfileStore()

const layoutClass = computed(() => {
  return {
    layout: true,
    'layout-mobile': true,
    // desktop: device.isDesktop,
    // mobile: device.isMobile,
  }
})

// const isProfileFloatButtonVisible = computed(() => {
//   let route = useRoute()
//   return RouteConstants.isSettings(route.path) || route.path === RouteConstants.ROUTE_TRANSACTION_ID
// })
</script>
