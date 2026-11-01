<template>
  <van-grid-item>
    <div class="flex items-center justify-center flex-col" :class="{ 'opacity-35 grayscale': props.muted }">
      <app-icon :icon="props.icon" :size="26" :stroke="1.4" />

      <div class="font-normal text-12 text-center text-muted">{{ props.name }}</div>
      <div class="font-extrabold text-12 text-center">{{ props.value }}</div>
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

