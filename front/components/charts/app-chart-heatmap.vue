<template>
  <div v-if="isRedacted" class="app-chart-heatmap-redacted">
    <app-icon :icon="TablerIconConstants.eyeHidden" :size="20" />
  </div>

  <div v-else class="app-chart-heatmap-scroll" role="img" :aria-label="ariaLabel">
    <div class="app-chart-heatmap-grid" :style="gridStyle">
      <div class="app-chart-heatmap-cell app-chart-heatmap-corner" />
      <div v-for="month in months" :key="`h-${month.key}`" class="app-chart-heatmap-cell app-chart-heatmap-header">{{ month.key.slice(5) }}</div>

      <template v-for="row in rows" :key="row.id">
        <div class="app-chart-heatmap-cell app-chart-heatmap-row-label">{{ row.label }}</div>
        <div
          v-for="cell in row.values"
          :key="`${row.id}-${cell.key}`"
          class="app-chart-heatmap-cell app-chart-heatmap-value"
          :class="{ 'app-chart-heatmap-clickable': cell.isLoaded && cell.value > 0 }"
          :tabindex="cell.isLoaded && cell.value > 0 ? 0 : -1"
          :style="cellStyle(row, cell)"
          :title="cell.isLoaded ? formatValue(cell.value) : ''"
          :aria-label="cell.isLoaded ? `${row.label} ${cell.key}: ${formatValue(cell.value)}` : `${row.label} ${cell.key}: not loaded`"
          @click="onCellSelect(row, cell)"
          @keydown.enter="onCellSelect(row, cell)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { sequentialBucket } from '~/utils/ChartUtils'
import { useAnalyticsStore } from '~/stores/analyticsStore'

const props = defineProps({
  rows: { type: Array, required: true }, // [{id, label, values: [{key, value, isLoaded}]}]
  months: { type: Array, required: true }, // [{key, ...}]
  maxValue: { type: Number, required: true },
  formatValue: { type: Function, default: (n) => String(n) },
  ariaLabel: { type: String, required: true },
  normalize: { type: Boolean, default: false }, // each row buckets against its own max instead of the shared maxValue
})

const emit = defineEmits(['cell-select'])

const analyticsStore = useAnalyticsStore()
const isRedacted = computed(() => analyticsStore.isAmountsHidden)

const gridStyle = computed(() => ({ gridTemplateColumns: `minmax(96px, auto) repeat(${props.months.length}, minmax(28px, 1fr))` }))

const rowMax = computed(() => new Map(props.rows.map((row) => [row.id, Math.max(0, ...row.values.map((v) => v.value))])))

function cellStyle(row, cell) {
  if (!cell.isLoaded) return { background: 'var(--viz-grid)' }
  const max = props.normalize ? rowMax.value.get(row.id) : props.maxValue
  return { background: `var(--viz-sequential-${sequentialBucket(cell.value, max)})` }
}

function onCellSelect(row, cell) {
  if (!cell.isLoaded || cell.value <= 0) return
  emit('cell-select', { monthKey: cell.key, id: row.id })
}
</script>

<style scoped>
.app-chart-heatmap-scroll {
  overflow-x: auto;
}

.app-chart-heatmap-grid {
  display: grid;
  gap: 2px;
}

.app-chart-heatmap-cell {
  display: flex;
  align-items: center;
  min-height: 20px;
}

.app-chart-heatmap-header,
.app-chart-heatmap-row-label {
  font-size: 11px;
  color: var(--semi-black);
  white-space: nowrap;
}

.app-chart-heatmap-header {
  justify-content: center;
}

.app-chart-heatmap-value {
  border-radius: 2px;
  outline-offset: -2px;
}

.app-chart-heatmap-clickable {
  cursor: pointer;
}

.app-chart-heatmap-redacted {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(45deg, var(--viz-grid), var(--viz-grid) 6px, transparent 6px, transparent 12px);
  border-radius: 8px;
  color: var(--semi-black);
}
</style>
