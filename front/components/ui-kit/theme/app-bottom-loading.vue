<template>
  <div v-if="dashboardStore.isSyncRequiredByMissingExtras" class="app-bottom-loading display-flex flex-column">
    <div class="flex-center-vertical gap-2">
      <span class="text-size-12 font-weight-400">Found extras that require resync.</span>
      <van-button size="small" @click="onResync"> Sync </van-button>
    </div>
  </div>
</template>

<script setup>
import { useDashboardStore } from '~/stores/useDashboardStore'
import { useProfileStore } from '~/stores/profileStore'
import { IconRotateClockwise } from '@tabler/icons-vue'

const dashboardStore = useDashboardStore()
const profileStore = useProfileStore()
const route = useRoute()

const onResync = async () => {
  await dashboardStore.syncEverything()
  reloadNuxtApp()
}
</script>

<style></style>
