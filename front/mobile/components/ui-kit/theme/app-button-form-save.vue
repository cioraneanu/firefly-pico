<template>
  <div class="mx-save">
    <slot name="left" />
    <button type="submit" class="mx-btn pri" :disabled="disabled">
      <app-icon :icon="IconCheck" :size="16" :stroke="2" />
      <span>{{ label ?? $t('save') }}</span>
    </button>
    <slot name="right" />
  </div>
</template>

<script setup>
import { IconCheck } from '@tabler/icons-vue'
import { animateSaveButton } from '~/core/utils/AnimationUtils.js'

// Sticky full-width Save bar above the bottom nav (design: .mx-save). Lives inside <app-form>, so it submits it.
// The page's .mx-body needs the `has-save` class so the last field is not hidden behind the bar.
defineProps({
  label: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

onMounted(animateSaveButton)
</script>
