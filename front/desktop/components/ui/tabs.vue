<template>
  <div
    role="radiogroup"
    :class="
      line
        ? 'flex gap-0.5 overflow-x-auto border-b border-line px-1'
        : ['auto-cols-fr grid-flow-col gap-0.5 rounded-lg p-0.5 text-dim shadow-[inset_0_0_0_1px_var(--d-line)]', sm ? 'h-7' : 'h-8', block ? 'grid' : 'inline-grid w-fit max-w-full']
    "
  >
    <button
      v-for="option in options"
      :key="option.label"
      type="button"
      role="radio"
      :aria-checked="isEqual(model, option.value)"
      :class="[
        'relative inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors',
        line ? 'my-1 h-10 flex-1 px-3 text-sm hover:bg-soft' : sm ? 'px-[7px] text-[13px]' : 'px-[9px] text-sm',
        line
          ? isEqual(model, option.value)
            ? 'text-fg after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary'
            : 'text-dim/72 hover:text-dim'
          : isEqual(model, option.value)
            ? 'bg-primary text-on-primary'
            : 'hover:text-fg',
      ]"
      @click="model = option.value"
    >
      <component :is="option.icon" v-if="option.icon" :size="16" :class="!isEqual(model, option.value) && 'opacity-80'" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { isEqual } from 'lodash-es'

const model = defineModel()
defineProps({ options: Array, line: Boolean, block: Boolean, sm: Boolean })
</script>
