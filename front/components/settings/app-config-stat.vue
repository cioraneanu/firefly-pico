<template>
  <van-grid-item>
    <div class="flex-center flex-column" :class="{ 'opacity-35 filter-grayscale': props.muted }">
      <app-icon :icon="props.icon" :size="26" :stroke="1.4" />

      <div class="font-weight-400 text-size-12 text-center text-muted">{{ props.name }}</div>
      <div class="font-weight-800 text-size-12 text-center">{{ props.value }}</div>
    </div>
  </van-grid-item>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: [String, Object],
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  value: {
    type: [Number, String],
    default: '',
  },
  muted: {
    type: Boolean,
    default: false,
  },
})
</script>

