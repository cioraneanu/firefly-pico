<template>
  <div class="circular-progress-icon" :style="appCircleStyle">
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <circle class="progress-background" cx="50" cy="50" :r="radius" fill="none" :stroke="progressBackgroundColor" :stroke-width="strokeWidth" />
      <circle
        class="progress-bar"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke="progressColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
      />
    </svg>
    <div class="icon-container">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100,
  },
  size: {
    type: Number,
    default: 100,
  },
  strokeWidth: {
    type: Number,
    default: 10,
  },
  progressColor: {
    type: String,
    default: '#4CAF50',
  },
  progressBackgroundColor: {
    type: String,
    default: 'transparent',
  },
})

const radius = computed(() => 50 - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  const progressOffset = ((100 - props.progress) / 100) * circumference.value
  return props.progress === 100 ? 0 : progressOffset
})

const appCircleStyle = computed(() => {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
  }
})
</script>

<style scoped>
.circular-progress-icon {
  position: relative;
  display: inline-block;
  border-radius: 50%;
}

.progress-bar {
  transition: stroke-dashoffset 0.5s ease;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.icon-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
