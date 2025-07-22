<template>
  <van-grid-item>
    <div class="flex-center flex-column">
      <app-icon :icon="props.icon" :size="26" :stroke="1.4" />

      <div class="font-weight-400 text-size-12 text-center text-muted">{{ props.name }}</div>
      <div class="font-weight-800 text-size-12 text-center">{{ props.value }}</div>
    </div>
  </van-grid-item>
</template>

<script setup>
const props = defineProps({
  icon: {},
  name: {},
  value: {},
})
</script>
