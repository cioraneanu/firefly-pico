<template>
  <button type="button" class="flex items-center gap-3 min-h-10 text-left" role="checkbox" :aria-checked="!!modelValue" @click="modelValue = !modelValue">
    <span class="mx-ck" :class="{ on: !!modelValue }"><app-icon :icon="IconCheck" :size="14" :stroke="3" /></span>
    <span class="text-14">
      <slot name="label">{{ label }}</slot>
    </span>
  </button>
</template>

<script setup>
import { IconCheck } from '@tabler/icons-vue'

const modelValue = defineModel()
defineProps({
  label: { type: String, default: null },
})
</script>
