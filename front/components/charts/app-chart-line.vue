<template>
  <app-chart-frame :uplot-options="uplotOptions" :data="chartData" :aria-label="ariaLabel" :redact-when-hidden="redactWhenHidden" @point-select="onPointSelect">
    <template #tooltip="{ idx }">
      <div v-if="rows[idx]" class="app-chart-line-tooltip">
        <div class="font-weight-600">{{ rows[idx].key }}</div>
        <div v-if="rows[idx].value != null" class="flex-center-vertical gap-1">
          <span class="app-chart-line-tooltip-dot" :style="{ background: `var(${colorVar})` }" />
          <span class="flex-1">{{ seriesLabel }}</span>
          <span>{{ formatValue(rows[idx].value) }}</span>
        </div>
        <div v-if="target != null" class="flex-center-vertical gap-1">
          <span class="app-chart-line-tooltip-dot" style="background: var(--viz-grid-baseline)" />
          <span class="flex-1">{{ targetLabel }}</span>
          <span>{{ formatValue(target) }}</span>
        </div>
      </div>
    </template>
  </app-chart-frame>
</template>

<script setup>
import { CHART_LINE_WIDTH, CHART_AREA_ALPHA, resolveCssVar, withAlpha, drawHorizontalRule } from '~/utils/ChartUtils'

const profileStore = useProfileStore()

// Purpose-built for Part 1's "line + solid target rule" form (currently: savings rate over
// time) — a single series, not a generic multi-line component.
const props = defineProps({
  rows: { type: Array, required: true }, // [{key, isLoaded, value: number|null}] — null renders as a gap
  target: { type: Number, default: null },
  formatValue: { type: Function, default: (n) => String(n) },
  ariaLabel: { type: String, required: true },
  seriesLabel: { type: String, required: true },
  targetLabel: { type: String, default: '' },
  colorVar: { type: String, default: '--primary-action' },
  // A ratio-mode chart (savings rate) leaks no absolute values, so it's explicitly exempt from
  // structural privacy masking (ANALYTICS_PLAN.md Part 1: "percent-mode views may stay visible")
  // — the savings-rate section passes false. A future money-denominated line (e.g. net worth)
  // keeps the default true.
  redactWhenHidden: { type: Boolean, default: true },
})

const emit = defineEmits(['month-select'])

// uPlot draws a null y-value as a gap in the line automatically — a not-yet-loaded month and a
// zero/negative-income month (Part 1's "null, not 0" rule) both fall out of this for free.
const chartData = computed(() => [props.rows.map((_, index) => index), props.rows.map((r) => r.value)])

const uplotOptions = computed(() => {
  const values = props.rows.map((r) => r.value).filter((v) => v != null)
  const withTarget = props.target != null ? [...values, props.target] : values
  const rawMax = Math.max(0, ...withTarget, 0.01)
  const rawMin = Math.min(0, ...withTarget)
  // Padded so the target rule (or the highest/lowest real point) never sits flush against the
  // plot's own border — without this, a target-only range (no real data yet) draws the target
  // line exactly on top of the axis edge, making it invisible.
  const pad = Math.max((rawMax - rawMin) * 0.1, 0.01)
  const yMax = rawMax + pad
  const yMin = rawMin - pad

  return {
    scales: { x: { time: false }, y: { range: () => [yMin, yMax] } },
    axes: [
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.rows[t]?.key?.slice(5) ?? '') },
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.formatValue(t)) },
    ],
    series: [
      {},
      {
        label: props.seriesLabel,
        stroke: props.colorVar,
        fill: resolveColor(props.colorVar),
        width: CHART_LINE_WIDTH,
        points: { show: false },
      },
    ],
    legend: { show: false },
    hooks: { draw: [(u) => drawHorizontalRule(u, { value: props.target, colorVar: '--viz-grid-baseline' })] },
  }
})

// The area-wash fill needs an rgba literal (canvas has no CSS-var-plus-opacity composition) —
// app-chart-frame.vue resolves `stroke`/`fill` that start with '--', but only as a flat color, so
// the alpha blend happens here before the value ever reaches it. Reading profileStore.darkTheme
// makes this a reactive dependency of the `uplotOptions` computed above — without it, a dark-mode
// toggle would still trigger app-chart-frame's own rebuild, but reuse this already-resolved (now
// stale) color, since resolveCssVar()'s getComputedStyle() read isn't itself reactive to Vue.
function resolveColor(colorVar) {
  void profileStore.darkTheme
  return withAlpha(resolveCssVar(colorVar), CHART_AREA_ALPHA)
}

function onPointSelect({ idx }) {
  const row = props.rows[idx]
  if (!row) return
  emit('month-select', { monthKey: row.key })
}
</script>

<style scoped>
.app-chart-line-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-chart-line-tooltip-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
