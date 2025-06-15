<template>
  <div :class="layoutClass">
    <profile-picker />

    <slot />

    <app-bottom-toolbar />
    <app-bottom-loading />
  </div>
</template>

import { ref } from 'vue';

<script setup>
const device = useDevice()

const layoutClass = computed(() => {
  return {
    layout: true,
    desktop: device.isDesktop,
    mobile: device.isMobile,
  }
})
</script>
