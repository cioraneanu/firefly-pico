<template>
  <div class="app-chart-meter">
    <div class="app-chart-meter-track" :style="{ background: colorStyle, opacity: 0.18 }" />
    <div class="app-chart-meter-fill" :style="{ width: `${fillPercent}%`, background: colorStyle }" />
  </div>
</template>

<script setup>
// Linear "fill = severity, track = lighter step of the same ramp" meter (ANALYTICS_PLAN.md Part
// 1). Plain DOM, not app-chart-frame.vue/canvas — this is a snapshot fill, not a continuous time
// series, following the same "plain DOM for non-continuous marks" precedent bar-chart-item-
// horizontal.vue/-diverging.vue already set in Phase 3b/3c. Track is derived at render time as
// the same colour at reduced opacity (CSS opacity, not a canvas fillStyle — no withAlpha() needed
// here), rather than a second set of --viz-status-*-track tokens.
const props = defineProps({
  percent: { type: Number, required: true }, // 0-100+, uncapped — overspend is a real state, not clamped away
  severity: { type: String, default: null }, // 'good'|'warning'|'serious'|'critical', from AnalyticsUtils.budgetSeverity()
})

const fillPercent = computed(() => Math.min(Math.max(props.percent, 0), 100))
const colorStyle = computed(() => (props.severity ? `var(--viz-status-${props.severity})` : 'var(--viz-grid-baseline)'))
</script>

<style scoped>
.app-chart-meter {
  position: relative;
  height: 8px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.app-chart-meter-track {
  position: absolute;
  inset: 0;
}

.app-chart-meter-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 4px;
  transition: width 0.2s ease;
}
</style>
