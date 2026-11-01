<template>
  <textarea
    v-model="model"
    :rows
    :placeholder
    class="block min-h-18 w-full resize-y rounded-lg border border-field px-2.5 py-2 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-field/30"
  />
</template>

<script setup>
const model = defineModel()
defineProps({ rows: { default: 3 }, placeholder: String })
</script>
