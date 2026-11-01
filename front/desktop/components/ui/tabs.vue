<template>
  <div role="radiogroup" class="inline-flex h-8 w-fit items-center rounded-lg bg-soft p-[3px] text-dim">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :class="[
        'inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 text-sm font-medium transition-colors hover:text-fg',
        model === option.value && 'bg-bg text-fg shadow-sm dark:border-field dark:bg-field/30',
      ]"
      @click="model = option.value"
    >
      <component :is="option.icon" v-if="option.icon" :size="16" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
const model = defineModel()
defineProps({ options: Array })
</script>
