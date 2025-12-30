<template>
  <div :class="layoutClass">
    <template v-if="device.isMobile">
      <slot />
      <app-bottom-toolbar />
    </template>

    <template v-else>
      <div class="display-flex gap-3">
        <app-left-sidebar />
        <div class="desktop-content">
          <slot />
        </div>
      </div>
    </template>


    <profile-picker-float v-if="true" />
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

// const isProfileFloatButtonVisible = computed(() => {
//   let route = useRoute()
//   return RouteConstants.isSettings(route.path) || route.path === RouteConstants.ROUTE_TRANSACTION_ID
// })
</script>
