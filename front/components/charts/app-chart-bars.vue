<template>
  <app-chart-frame :uplot-options="uplotOptions" :data="chartData" :aria-label="ariaLabel" @point-select="onPointSelect">
    <template #tooltip="{ idx }">
      <div v-if="rows[idx]" class="app-chart-bars-tooltip">
        <div class="font-weight-600">{{ rows[idx].key }}</div>
        <div class="flex-center-vertical gap-1">
          <span class="app-chart-bars-tooltip-dot" style="background: var(--viz-income)" />
          <span class="flex-1">{{ incomeLabel }}</span>
          <span>{{ formatValue(rows[idx].income) }}</span>
        </div>
        <div class="flex-center-vertical gap-1">
          <span class="app-chart-bars-tooltip-dot" style="background: var(--viz-expense)" />
          <span class="flex-1">{{ expenseLabel }}</span>
          <span>{{ formatValue(rows[idx].expense) }}</span>
        </div>
        <div v-if="showNetLine" class="flex-center-vertical gap-1">
          <span class="app-chart-bars-tooltip-dot" style="background: var(--semi-black)" />
          <span class="flex-1">{{ netLabel }}</span>
          <span>{{ formatValue(rows[idx].net) }}</span>
        </div>
      </div>
    </template>
  </app-chart-frame>
</template>

<script setup>
import uPlot from 'uplot'
import { CHART_BAR_SIZE_FACTOR, CHART_BAR_RADIUS, drawHorizontalRule } from '~/utils/ChartUtils'

// Purpose-built for Part 1's "income vs expense split across a zero baseline" form, not a
// generic bars component — with an optional net line sharing the same axis.
const props = defineProps({
  rows: { type: Array, required: true }, // [{key, isLoaded, income, expense, net}]
  formatValue: { type: Function, default: (n) => String(n) },
  ariaLabel: { type: String, required: true },
  incomeLabel: { type: String, required: true },
  expenseLabel: { type: String, required: true },
  netLabel: { type: String, default: '' },
  showNetLine: { type: Boolean, default: true },
})

const emit = defineEmits(['month-select'])

const chartData = computed(() => {
  const cols = [props.rows.map((_, index) => index), props.rows.map((r) => r.income), props.rows.map((r) => -r.expense)]
  if (props.showNetLine) cols.push(props.rows.map((r) => r.net))
  return cols
})

const uplotOptions = computed(() => {
  const allValues = props.rows.flatMap((r) => [r.income, -r.expense, ...(props.showNetLine ? [r.net] : [])])
  const yMax = Math.max(0, ...allValues, 1)
  const yMin = Math.min(0, ...allValues)

  // Income and expense never overlap in y (one rises from zero, the other falls from zero), so
  // there's no need to offset them side-by-side within each month's band the way stacked segments
  // need — each is a plain full-width bar at its own month's natural position, distinguished by
  // color and by which side of the zero baseline it falls on.
  const series = [
    {},
    {
      label: props.incomeLabel,
      stroke: '--viz-income',
      fill: '--viz-income',
      points: { show: false },
      paths: uPlot.paths.bars({ size: CHART_BAR_SIZE_FACTOR, radius: CHART_BAR_RADIUS }),
    },
    {
      label: props.expenseLabel,
      stroke: '--viz-expense',
      fill: '--viz-expense',
      points: { show: false },
      paths: uPlot.paths.bars({ size: CHART_BAR_SIZE_FACTOR, radius: CHART_BAR_RADIUS }),
    },
  ]
  if (props.showNetLine) {
    series.push({ label: props.netLabel, stroke: '--semi-black', width: 2, points: { show: false } })
  }

  return {
    scales: { x: { time: false }, y: { range: () => [yMin, yMax] } },
    axes: [
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.rows[t]?.key?.slice(5) ?? '') },
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => props.formatValue(Math.abs(t))) },
    ],
    series,
    legend: { show: false },
    // A regular gridline at zero isn't visually distinct from the rest — Part 1 calls for one
    // emphasized baseline hairline specifically because income/expense split across zero is the
    // one chart form where that line carries real meaning (the sign boundary).
    hooks: { draw: [(u) => drawHorizontalRule(u, { value: 0, colorVar: '--viz-grid-baseline' })] },
  }
})

function onPointSelect({ idx }) {
  const row = props.rows[idx]
  if (!row) return
  emit('month-select', { monthKey: row.key })
}
</script>

<style scoped>
.app-chart-bars-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-chart-bars-tooltip-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
