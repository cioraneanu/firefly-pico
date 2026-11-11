<template>
  <div class="mx-list">
    <button type="button" class="mx-row link dng w-full text-left" @click="emit('click')">
      <span class="mx-lead sm"><app-icon :icon="IconTrash" :size="16" :stroke="2" /></span>
      <span class="mx-row__m"
        ><span class="mx-row__t">{{ label ?? $t('delete') }}</span></span
      >
    </button>
  </div>
</template>

<script setup>
import { IconTrash } from '@tabler/icons-vue'

// Destructive action in its own list at the bottom of a form (design). The page confirms through UIUtils.
defineProps({
  label: { type: String, default: null },
})
const emit = defineEmits(['click'])
</script>
