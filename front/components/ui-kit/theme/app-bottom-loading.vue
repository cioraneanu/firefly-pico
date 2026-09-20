<template>
  <div v-if="appStore.isSyncRequiredByMissingExtras" class="app-bottom-loading display-flex flex-column">
    <div class="flex-center-vertical gap-2">
      <span class="text-size-12 font-weight-400">Found extras that require resync.</span>
      <van-button size="small" @click="onResync"> Sync </van-button>
    </div>
  </div>
</template>

<script setup>
import { useDashboardStore } from '~/stores/dashboardStore'
import { useProfileStore } from '~/stores/profileStore'
import { IconRotateClockwise } from '@tabler/icons-vue'

const appStore = useAppStore()

const onResync = async () => {
  // The local stores are known to be missing entities, so rebuild them even if our hash
  // still matches what the backend has.
  await appStore.syncEverything({ force: true })
  reloadNuxtApp()
}
</script>
