<template>
  <div :class="layoutClass">
    <slot />

    <profile-picker-float v-if="isProfileFloatButtonVisible" />
    <app-bottom-toolbar />
    <app-bottom-loading />
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'

const device = useDevice()

const layoutClass = computed(() => {
  return {
    layout: true,
    desktop: device.isDesktop,
    mobile: device.isMobile,
  }
})

const isProfileFloatButtonVisible = computed(() => {
  let route = useRoute()
  return RouteConstants.isSettings(route.path) || route.path === RouteConstants.ROUTE_TRANSACTION_ID
})
</script>
