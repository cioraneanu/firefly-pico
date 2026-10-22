<template>
  <div v-if="appStore.isSyncRequiredByMissingExtras" class="app-bottom-loading flex flex-col">
    <div class="flex items-center gap-2">
      <span class="text-12 font-normal">Found extras that require resync.</span>
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

