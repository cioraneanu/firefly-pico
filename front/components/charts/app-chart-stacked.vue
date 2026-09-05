<template>
  <app-chart-frame :uplot-options="uplotOptions" :data="chartData" :aria-label="ariaLabel" @point-select="onPointSelect">
    <template #tooltip="{ idx }">
      <div v-if="stacked[idx]" class="app-chart-stacked-tooltip">
        <div class="font-weight-600">{{ stacked[idx].key }}</div>
        <div v-for="s in series" :key="s.id" class="flex-center-vertical gap-1">
          <span class="app-chart-stacked-tooltip-dot" :style="{ background: `var(${s.colorVar})` }" />
          <span class="flex-1">{{ s.label }}</span>
          <span>{{ formatValue(rows[idx].values[s.id] ?? 0) }}</span>
        </div>
      </div>
    </template>
  </app-chart-frame>
</template>

<script setup>
import uPlot from 'uplot'
import { CHART_BAR_SIZE_FACTOR, CHART_BAR_RADIUS, stackSeries } from '~/utils/ChartUtils'

const props = defineProps({
  series: { type: Array, required: true }, // [{id, label, colorVar}] — colorVar is a '--viz-*' name
  rows: { type: Array, required: true }, // [{key, isLoaded, values: Record<id, number>}]
  formatValue: { type: Function, default: (n) => String(n) },
  ariaLabel: { type: String, required: true },
})

const emit = defineEmits(['segment-select'])

const seriesIds = computed(() => props.series.map((s) => s.id))
const stacked = computed(() => stackSeries(props.rows, seriesIds.value))
const maxTotal = computed(() => Math.max(...stacked.value.map((row) => row.total), 1))

const chartData = computed(() => [props.rows.map((_, index) => index), ...props.series.map((s) => props.rows.map((row) => row.values[s.id] ?? 0))])

function bandFacet(seriesId, boundary) {
  return {
    unit: 1, // uPlot.BarsPathBuilderFacetUnit.ScaleValue
    values: (u, seriesIdx, idx0, idx1) => stacked.value.slice(idx0, idx1 + 1).map((row) => row.bands[seriesId]?.[boundary] ?? 0),
  }
}

const uplotOptions = computed(() => ({
  scales: {
    x: { time: false },
    y: { range: () => [0, maxTotal.value] },
  },
  axes: [
    { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.rows[t]?.key?.slice(5) ?? '') },
    { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.formatValue(t)) },
  ],
  series: [
    {},
    ...props.series.map((s) => ({
      label: s.label,
      stroke: s.colorVar,
      fill: s.colorVar,
      // uPlot draws a point marker per raw data value by default, on top of whatever the paths
      // renderer draws — a leftover from its line-chart origins that has no purpose here (bars
      // already encode the value; disp.y0/y1 override the actual drawn geometry anyway).
      points: { show: false },
      paths: uPlot.paths.bars({
        size: CHART_BAR_SIZE_FACTOR,
        radius: CHART_BAR_RADIUS,
        disp: { y0: bandFacet(s.id, 'from'), y1: bandFacet(s.id, 'to') },
      }),
    })),
  ],
  legend: { show: false }, // table twin covers this; series[].label still feeds the tooltip
}))

function onPointSelect({ idx, val }) {
  const row = stacked.value[idx]
  if (!row) return
  const seriesId = seriesIds.value.find((id) => val >= row.bands[id]?.from && val <= row.bands[id]?.to)
  // 'other' never drills through — no safe query fragment for "everything except these N
  // categories" (ANALYTICS_PLAN.md Part 7). A click that lands on the Other segment simply no-ops.
  if (!seriesId || seriesId === 'other') return
  emit('segment-select', { monthKey: props.rows[idx].key, seriesId })
}
</script>

<style scoped>
.app-chart-stacked-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-chart-stacked-tooltip-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
