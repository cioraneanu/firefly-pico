<template>
  <label class="flex h-8 cursor-pointer items-center gap-2 text-sm">
    <span :class="['grid size-4 shrink-0 place-items-center rounded border transition-colors', model ? 'border-primary bg-primary text-on-primary' : 'border-field dark:bg-field/30']">
      <icon-check v-if="model" :size="12" :stroke-width="3" />
    </span>
    <input v-model="model" type="checkbox" class="sr-only" />
    <slot />
  </label>
</template>

<script setup>
import { IconCheck } from '@tabler/icons-vue'

const model = defineModel()
</script>
