<template>
  <app-chart-frame :uplot-options="uplotOptions" :data="chartData" :aria-label="ariaLabel" @point-select="onPointSelect">
    <template #tooltip="{ idx }">
      <div class="app-chart-multiline-tooltip">
        <div class="font-weight-600">{{ dayLabel(idx) }}</div>
        <div v-for="line in series" :key="line.id" class="flex-center-vertical gap-1">
          <span class="app-chart-multiline-tooltip-dot" :style="{ background: `var(${line.colorVar})` }" />
          <span class="flex-1">{{ line.label }}</span>
          <span>{{ formatValue(line.values[idx]) }}</span>
        </div>
        <div class="flex-center-vertical gap-1">
          <span class="app-chart-multiline-tooltip-dot" style="background: var(--viz-grid-baseline)" />
          <span class="flex-1">{{ idealLabel }}</span>
          <span>{{ formatValue(idealValueAt(idx)) }}</span>
        </div>
      </div>
    </template>
  </app-chart-frame>
</template>

<script setup>
import { drawDiagonalRule } from '~/utils/ChartUtils'

// N lines sharing one axis (top-N budgets + Other, per the user's explicit "one chart, one line
// per budget" decision on burn-rate pacing) plus a single shared dashed ideal-pace diagonal — no
// existing chart component plots more than one line (app-chart-line.vue is explicitly single-
// series). No area-wash fill: with N lines a wash per line would be visual noise (Part 1's washes
// are for "the series that matters," not every series at once).
const props = defineProps({
  series: { type: Array, required: true }, // [{id, label, colorVar, values: (number|null)[]}]
  totalDays: { type: Number, required: true },
  formatValue: { type: Function, default: (n) => `${Math.round(n)}%` },
  formatDay: { type: Function, default: (dayIndex) => `${dayIndex + 1}` },
  ariaLabel: { type: String, required: true },
  idealLabel: { type: String, required: true },
})

const emit = defineEmits(['day-select'])

function idealValueAt(dayIndex) {
  return props.totalDays > 1 ? (dayIndex / (props.totalDays - 1)) * 100 : 100
}

function dayLabel(dayIndex) {
  return props.formatDay(dayIndex)
}

const chartData = computed(() => [Array.from({ length: props.totalDays }, (_, i) => i), ...props.series.map((line) => line.values)])

const uplotOptions = computed(() => {
  const allValues = props.series.flatMap((line) => line.values.filter((v) => v != null))
  const yMax = Math.max(100, ...allValues, 1) * 1.05

  return {
    scales: { x: { time: false }, y: { range: () => [0, yMax] } },
    axes: [
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => t + 1) },
      { stroke: '--semi-black', grid: { stroke: '--viz-grid' }, values: (u, ticks) => ticks.map((t) => `${Math.round(t)}%`) },
    ],
    series: [
      {},
      ...props.series.map((line) => ({
        label: line.label,
        stroke: line.colorVar,
        width: 2,
        points: { show: false },
      })),
    ],
    legend: { show: false },
    hooks: {
      draw: [(u) => drawDiagonalRule(u, { from: { x: 0, y: 0 }, to: { x: props.totalDays - 1, y: 100 }, colorVar: '--viz-grid-baseline' })],
    },
  }
})

function onPointSelect({ idx }) {
  emit('day-select', { dayIndex: idx })
}
</script>

<style scoped>
.app-chart-multiline-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 220px;
}

.app-chart-multiline-tooltip-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
