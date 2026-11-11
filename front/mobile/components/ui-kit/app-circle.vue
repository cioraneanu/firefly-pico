<template>
  <div class="relative inline-grid place-items-center shrink-0 rounded-full" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" viewBox="0 0 100 100" class="absolute inset-0">
      <circle cx="50" cy="50" :r="radius" fill="none" :stroke-width="strokeWidth" :style="{ stroke: progressBackgroundColor }" />
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        :style="{ stroke: progressColor, transition: 'stroke-dashoffset 0.5s ease' }"
      />
    </svg>
    <slot />
  </div>
</template>

<script setup>
// Circular progress ring with content in the middle. Colors accept CSS variables (e.g. var(--foreground)).
const props = defineProps({
  progress: { type: Number, required: true, validator: (value) => value >= 0 && value <= 100 },
  size: { type: Number, default: 100 },
  strokeWidth: { type: Number, default: 10 },
  progressColor: { type: String, default: 'var(--foreground)' },
  progressBackgroundColor: { type: String, default: 'var(--muted)' },
})

const radius = computed(() => 50 - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => ((100 - props.progress) / 100) * circumference.value)
</script>
