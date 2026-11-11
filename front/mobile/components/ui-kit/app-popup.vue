<template>
  <app-sheet v-model:show="show" :title="title" :full="full">
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </app-sheet>
</template>

<script setup>
// Kept for older call sites: a titled bottom sheet without search.
const show = defineModel('show', { type: Boolean, default: false })

defineProps({
  title: { type: String, default: '' },
  full: { type: Boolean, default: true },
})
</script>
