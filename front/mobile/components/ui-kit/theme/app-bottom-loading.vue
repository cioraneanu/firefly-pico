<template>
  <div v-if="appStore.isSyncRequiredByMissingExtras" class="mx-sync" role="status">
    <span>{{ $t('sync_required_by_extras') }}</span>
    <button type="button" class="mx-btn xs pri" @click="onResync">{{ $t('sync') }}</button>
  </div>
</template>

<script setup>
// Background sync notice (design: .mx-sync pill, bottom-left above the nav)
const appStore = useAppStore()

const onResync = async () => {
  await appStore.syncEverything()
  reloadNuxtApp()
}
</script>
