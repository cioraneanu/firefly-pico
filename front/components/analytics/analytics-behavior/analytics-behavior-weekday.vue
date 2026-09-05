<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.behavior.weekday.title') }}:</div>
      <van-popover v-model:show="showDescriptionPopover" placement="bottom-end">
        <div class="text-size-12 p-10" style="max-width: 280px">{{ $t('analytics.behavior.weekday.description') }}</div>
        <template #reference>
          <button type="button" class="app-button-icon">
            <app-icon :icon="TablerIconConstants.settingsAbout" :size="18" />
          </button>
        </template>
      </van-popover>
    </div>

    <div v-if="analyticsStore.isAmountsHidden" class="analytics-behavior-weekday-redacted ml-15 mr-15 mb-2" />

    <template v-else>
      <div class="text-size-12 analytics-axis-caption ml-15 mr-15 mb-2">{{ `${$t('analytics.axis.amount')} (${analyticsStore.currencyCode})` }}</div>

      <div class="display-flex gap-2">
        <div class="flex-1" />
        <bar-chart-item-vertical v-for="bar in bars" :key="bar.day" v-bind="bar" />
        <div class="flex-1" />
      </div>
    </template>
  </van-cell-group>
</template>

<script setup>
import { addDays, format, startOfWeek } from 'date-fns'
import { capitalize } from 'lodash-es'
import { countWeekdayOccurrences } from '~/utils/AnalyticsUtils'
import { sequentialBucket } from '~/utils/ChartUtils'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months, range } = useAnalyticsRange()

const showDescriptionPopover = ref(false)

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

.analytics-axis-caption {
  color: var(--semi-black);
}
</style>
