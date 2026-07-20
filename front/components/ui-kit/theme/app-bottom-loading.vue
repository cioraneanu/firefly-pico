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
  await appStore.syncEverything()
  reloadNuxtApp()
}
</script>

