<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.behavior.weekday.title') }}:</div>

    <div v-if="analyticsStore.isAmountsHidden" class="analytics-behavior-weekday-redacted ml-15 mr-15 mb-2" />

    <div v-else class="display-flex gap-2">
      <div class="flex-1" />
      <bar-chart-item-vertical v-for="bar in bars" :key="bar.day" v-bind="bar" />
      <div class="flex-1" />
    </div>
  </van-cell-group>
</template>

<script setup>
import { addDays, format, startOfWeek } from 'date-fns'
import { capitalize } from 'lodash-es'
import { countWeekdayOccurrences } from '~/utils/AnalyticsUtils'
import { sequentialBucket } from '~/utils/ChartUtils'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months, range } = useAnalyticsRange()

// No safe Firefly search fragment isolates "just Mondays" across a date range (unlike a single
// day, which dashboard-week-bars.vue can drill into) — these bars are deliberately non-clickable,
// same class of documented exception as useChartDrillThrough's "Other" bucket.
const bars = computed(() => {
  const totals = analyticsStore.weekdayTotals(months.value) // number[7], 0=Sun..6=Sat
  const occurrences = countWeekdayOccurrences(range.value.start, range.value.end)
  const averages = totals.map((total, day) => (occurrences[day] > 0 ? total / occurrences[day] : 0))
  const maxValue = Math.max(...averages, 1)
  const weekStart = startOfWeek(new Date()) // synthetic reference date — label-only, matches dashboard-week-bars.vue's own pattern

  return averages.map((average, day) => ({
    day,
    label: capitalize(format(addDays(weekStart, day), 'E')),
    value: formatNumberForDashboard(average),
    occurrences: occurrences[day],
    percent: (average / maxValue) * 100,
    getBackground: () => `var(--viz-sequential-${sequentialBucket(average, maxValue)})`,
  }))
})
</script>

<style scoped>
.analytics-behavior-weekday-redacted {
  height: 100px;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, var(--viz-grid), var(--viz-grid) 6px, transparent 6px, transparent 12px);
}
</style>
