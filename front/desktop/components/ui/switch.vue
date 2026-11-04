<template>
  <label class="inline-flex min-h-8 cursor-pointer items-center gap-2 text-sm">
    <button
      type="button"
      role="switch"
      :aria-checked="!!model"
      :class="[
        'relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        model ? 'bg-primary' : 'bg-field dark:bg-field/80',
      ]"
      @click="model = !model"
    >
      <span :class="['size-4 rounded-full bg-bg transition-transform dark:bg-fg', model && 'translate-x-3.5 dark:bg-on-primary']" />
    </button>
    <slot />
  </label>
</template>

<script setup>
const model = defineModel()
</script>
