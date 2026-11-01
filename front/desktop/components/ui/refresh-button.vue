<template>
  <d-button size="icon" :icon="IconRefresh" :loading="isLoading" :aria-label="$t('settings.setup.fetching')" @click="refresh" />
</template>

<script setup>
import { IconRefresh } from '@tabler/icons-vue'

const props = defineProps({ action: Function })
const isLoading = ref(false)

const refresh = async () => {
  isLoading.value = true
  await props.action()
  isLoading.value = false
}
</script>
