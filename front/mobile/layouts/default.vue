<template>
  <div class="mx-layout">
    <slot />
    <app-bottom-toolbar />
    <profile-picker-float v-if="profileStore.dashboard.isProfileFloatVisible" />
    <app-bottom-loading />
  </div>
</template>

<script setup>
import { useProfileStore } from '~/core/stores/profileStore'

const profileStore = useProfileStore()
</script>
