<template>
  <div class="mx-save">
    <slot name="left" />
    <button type="submit" class="mx-btn pri mx-save__btn" :class="{ busy: form?.isSubmitting.value }" :disabled="disabled">
      <span>
        <app-icon :icon="IconCheck" :size="16" :stroke="2" />
        {{ label ?? $t('save') }}
      </span>
      <span class="mx-spin" />
    </button>
    <slot name="right" />
  </div>
</template>

<script setup>
import { IconCheck } from '@tabler/icons-vue'

// Sticky full-width Save bar above the bottom nav (design: .mx-save). Lives inside <app-form>, so it submits it
// and shows a spinner instead of its label while the form saves.
// The page's .mx-body needs the `has-save` class so the last field is not hidden behind the bar.
defineProps({
  label: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const form = inject('appForm', null)
</script>
