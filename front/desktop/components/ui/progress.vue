<template>
  <div class="h-1.5 w-full overflow-hidden rounded-full bg-soft">
    <div :class="['h-full rounded-full transition-all', value > 100 ? 'bg-danger' : 'bg-primary']" :style="{ width: `${Math.min(value, 100)}%` }" />
  </div>
</template>

<script setup>
defineProps({ value: { type: Number, default: 0 } })
</script>
