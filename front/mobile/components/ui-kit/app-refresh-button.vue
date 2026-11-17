<template>
  <button type="button" class="mx-ib sm" :aria-label="$t('kit.refresh')" @click="onRefresh">
    <span v-if="isLoading" class="mx-spin" />
    <app-icon v-else :icon="IconRefresh" :size="16" :stroke="2" />
  </button>
</template>

<script setup>
import { IconRefresh } from '@tabler/icons-vue'

// Refresh button of the pickers' sheet header: spins while `refresh` (a store fetch) runs
const props = defineProps({
  refresh: { type: Function, required: true },
})

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await props.refresh()
  isLoading.value = false
}
</script>
