<template>
  <van-grid-item>
    <div class="flex-center flex-column">
      <app-icon :icon="props.icon" :size="26" :stroke="1" />

      <div class="font-weight-400 text-size-12 text-muted">{{ props.name }}</div>
      <div class="font-weight-600 text-size-14 text-center">{{ props.value }}</div>
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
