<template>
  <button type="button" class="mx-btn sm pri" @click="emit('click')">
    <app-icon :icon="IconPlus" :size="16" :stroke="2" />
    <span>{{ label ?? $t('new') }}</span>
  </button>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'

defineProps({
  label: { type: String, default: null },
})
const emit = defineEmits(['click'])
</script>
