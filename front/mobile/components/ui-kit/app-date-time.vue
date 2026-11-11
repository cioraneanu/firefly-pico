<template>
  <app-date-time-grid v-model="modelValue" :label="label" />
</template>

<script setup>
// Older name of the date + time field; same control as app-date-time-grid.
const modelValue = defineModel()

defineProps({
  label: { type: String, default: null },
})
</script>
