<template>
  <span v-if="icon" class="ic"><app-icon :icon="icon" :size="16" :stroke="2" /></span>
  <span class="lb">{{ text }}</span>
</template>

<script setup>
// Content of a picker option row (inside .mx-opt): icon tile + label.
defineProps({
  text: {},
  icon: {},
  isSelected: { default: false },
})
</script>
