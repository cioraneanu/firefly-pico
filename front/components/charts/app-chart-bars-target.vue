<template>
  <app-chart-frame :uplot-options="uplotOptions" :data="chartData" :aria-label="ariaLabel" @point-select="onPointSelect">
    <template #tooltip="{ idx }">
      <div v-if="rows[idx]" class="app-chart-bars-target-tooltip">
        <div class="font-weight-600">{{ rows[idx].key }}</div>
        <div class="flex-center-vertical gap-1">
          <span class="app-chart-bars-target-tooltip-dot" :style="{ background: `var(${actualColorVar})` }" />
          <span class="flex-1">{{ actualLabel }}</span>
          <span>{{ formatValue(rows[idx].actual) }}</span>
        </div>
        <div v-if="rows[idx].limit != null" class="flex-center-vertical gap-1">
          <span class="app-chart-bars-target-tooltip-dot" :style="{ background: `var(${limitColorVar})` }" />
          <span class="flex-1">{{ limitLabel }}</span>
          <span>{{ formatValue(rows[idx].limit) }}</span>
        </div>
      </div>
    </template>
  </app-chart-frame>
</template>

<script setup>
import uPlot from 'uplot'
import { CHART_BAR_SIZE_FACTOR, CHART_BAR_RADIUS, CHART_LINE_WIDTH } from '~/utils/ChartUtils'

// A single bar series (never split across zero, unlike app-chart-bars.vue's income/expense
// form — "actual" here is always >= 0) plus a line overlay for a per-point target/limit that can
// vary between points (a budget's limit amount can change between periods) — structurally closer
// to app-chart-bars.vue's "bars + net line sharing one axis" shape than to a from-scratch chart,
// but NOT the same shape (no zero-baseline split), so it's a sibling component rather than a
// generalization of app-chart-bars.vue — see Phase 4a plan's "generalize vs duplicate" note.
const props = defineProps({
  rows: { type: Array, required: true }, // [{key, actual, limit: number|null}] — null limit renders as a gap
  formatValue: { type: Function, default: (n) => String(n) },
  ariaLabel: { type: String, required: true },
  actualLabel: { type: String, required: true },
  limitLabel: { type: String, required: true },
  actualColorVar: { type: String, default: '--viz-expense' },
  limitColorVar: { type: String, default: '--semi-black' },
})

const emit = defineEmits(['month-select'])

const chartData = computed(() => [props.rows.map((_, index) => index), props.rows.map((r) => r.actual), props.rows.map((r) => r.limit)])

const uplotOptions = computed(() => {
  const allValues = props.rows.flatMap((r) => [r.actual, r.limit].filter((v) => v != null))
  const yMax = Math.max(0, ...allValues, 1) * 1.1

  return {
    scales: { x: { time: false }, y: { range: () => [0, yMax] } },
    axes: [
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.rows[t]?.key?.slice(5) ?? '') },
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.formatValue(t)) },
    ],
    series: [
      {},
      {
        label: props.actualLabel,
        stroke: props.actualColorVar,
        fill: props.actualColorVar,
        points: { show: false },
        paths: uPlot.paths.bars({ size: CHART_BAR_SIZE_FACTOR, radius: CHART_BAR_RADIUS }),
      },
      {
        label: props.limitLabel,
        stroke: props.limitColorVar,
        width: CHART_LINE_WIDTH,
        points: { show: false },
      },
    ],
    legend: { show: false },
  }
})

function onPointSelect({ idx }) {
  const row = props.rows[idx]
  if (!row) return
  emit('month-select', { monthKey: row.key })
}
</script>

<style scoped>
.app-chart-bars-target-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-chart-bars-target-tooltip-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
