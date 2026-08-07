<template>
  <div class="position-relative display-inline-block" :style="appCircleStyle">
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <circle class="progress-background" cx="50" cy="50" :r="radius" fill="none" :stroke="progressBackgroundColor" :stroke-width="strokeWidth" />
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke="progressColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        style="transition: stroke-dashoffset 0.5s ease"
      />
    </svg>
    <div class="position-absolute-100 no-edge-top no-edge-left flex-center">
      <slot/>
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
    borderRadius: '50%',
  }
})
</script>

