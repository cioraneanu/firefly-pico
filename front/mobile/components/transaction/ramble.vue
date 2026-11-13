<template>
  <button v-if="appStore.llmIsConfigured" type="button" class="mx-btn out mx-btn40 relative" :aria-label="$t('transaction.assistant_ramble_title')" @click="openRamble">
    <app-icon :icon="IconMicrophone" :size="16" :stroke="2" />
    <span v-if="savedRamblesCount > 0" class="mx-badge pri">{{ savedRamblesCount > 99 ? '99+' : savedRamblesCount }}</span>
  </button>
</template>

<script setup>
import { IconMicrophone } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'

// Dictate button of the assistant: opens the "Dictate transactions" page with the assistant text, badge = saved rambles waiting.
const props = defineProps({
  assistantText: {
    type: String,
    default: '',
  },
})

const appStore = useAppStore()
const { savedRamblesCount, refreshSavedRambleCount } = useRamble()

const openRamble = () => navigateTo({ path: RouteConstants.ROUTE_RAMBLE, query: props.assistantText ? { text: props.assistantText } : {} })

onMounted(refreshSavedRambleCount)
</script>
