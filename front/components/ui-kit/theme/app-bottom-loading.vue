<template>
  <div v-if="dataStore.isLoadingExtras || dataStore.isSyncRequiredByMissingExtras" class="app-bottom-loading display-flex flex-column">
    <div v-if="dataStore.isLoadingExtras" class="flex-center-vertical gap-2">
      <span class="text-size-14 font-weight-500">Loading extras...</span>
      <icon-rotate-clockwise :size="24" :stroke-width="1.5" class="rotate" />
    </div>

    <div v-if="dataStore.isSyncRequiredByMissingExtras" class="flex-center-vertical gap-2">
      <span class="text-size-12 font-weight-400">Found extras that require resync.</span>
      <van-button @click="onResync" size="small"> Sync </van-button>
    </div>
  </div>
</template>

<script setup>
import { useDataStore } from '~/stores/dataStore'
import { useAppStore } from '~/stores/appStore'
import { IconRotateClockwise } from '@tabler/icons-vue'

const dataStore = useDataStore()
const appStore = useAppStore()
const route = useRoute()

const onResync = async () => {
  await dataStore.syncEverything()
  reloadNuxtApp()
}
</script>

<style></style>
