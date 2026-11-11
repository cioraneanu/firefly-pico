<template>
  <button type="button" class="mx-row link w-full text-left" @click="emit('click', $event)">
    <span class="mx-lead sm">
      <slot><app-icon v-if="icon" :icon="icon" :size="16" :stroke="2" /></slot>
    </span>
    <span class="mx-row__m">
      <span class="mx-row__t">{{ label }}</span>
      <span v-if="description" class="mx-row__s">{{ description }}</span>
    </span>
    <slot name="right" />
    <span v-if="isLink" class="mx-chev"><app-icon :icon="IconChevronRight" :size="16" :stroke="2" /></span>
  </button>
</template>

<script setup>
import { IconChevronRight } from '@tabler/icons-vue'

// Navigation row (design: .mx-row.link). Put several inside <app-card-info> / .mx-list.
defineProps({
  label: { type: String, default: '' },
  description: { type: String, default: null },
  icon: { default: null },
  isLink: { type: Boolean, default: true },
  size: { default: null },
})
const emit = defineEmits(['click'])
</script>
