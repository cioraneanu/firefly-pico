<template>
  <div role="radiogroup" :class="line ? 'flex gap-0.5 overflow-x-auto border-b border-line px-1' : ['h-8 items-center rounded-lg bg-soft p-[3px] text-dim', block ? 'flex' : 'inline-flex w-fit']">
    <button
      v-for="option in options"
      :key="option.label"
      type="button"
      role="radio"
      :aria-checked="isEqual(model, option.value)"
      :class="[
        'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors',
        line ? 'my-1 h-10 px-3 hover:bg-soft' : 'h-full border border-transparent px-2.5 hover:text-fg',
        line ? (isEqual(model, option.value) ? 'text-fg' : 'text-dim') : isEqual(model, option.value) && 'bg-bg text-fg shadow-sm dark:border-field dark:bg-field/30',
      ]"
      @click="model = option.value"
    >
      <component :is="option.icon" v-if="option.icon" :size="16" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { isEqual } from 'lodash-es'

const model = defineModel()
defineProps({ options: Array, line: Boolean, block: Boolean })
</script>
