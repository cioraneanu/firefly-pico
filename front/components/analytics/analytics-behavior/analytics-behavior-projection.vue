<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.behavior.projection.title') }}:</div>

    <div v-if="!projection.isLoaded" class="text-size-12 analytics-behavior-empty ml-15 mr-15 mb-2">{{ $t('analytics.behavior.projection.not_enough_data') }}</div>

    <template v-else>
      <div class="ml-15 mr-15 mb-2">
        <div class="flex-center-vertical gap-2 mb-1">
          <div class="text-size-12 flex-1">{{ $t('analytics.behavior.projection.day_progress', { day: projection.daysElapsed, total: projection.daysInMonth }) }}</div>
        </div>
        <app-chart-meter :percent="pacePercent ?? 0" :severity="paceSeverity" />
      </div>

      <div class="analytics-kpi-grid ml-15 mr-15 mb-2">
        <div class="analytics-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('analytics.behavior.projection.spent_so_far') }}</div>
          <div class="font-weight-600">{{ formatNumberForDashboard(projection.spentSoFar) }}</div>
        </div>
        <div class="analytics-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('analytics.behavior.projection.daily_rate') }}</div>
          <div class="font-weight-600">{{ formatNumberForDashboard(projection.regularDailyRate) }}</div>
          <div class="text-size-12 text-muted">{{ $t('analytics.behavior.projection.daily_rate_note') }}</div>
        </div>
        <div class="analytics-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('analytics.behavior.projection.projected') }}</div>
          <div class="font-weight-600">{{ formatNumberForDashboard(projection.projectedTotal) }}</div>
        </div>
        <div class="analytics-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('analytics.behavior.projection.vs_historical') }}</div>
          <div class="font-weight-600">{{ pacePercent == null ? $t('analytics.behavior.projection.not_enough_data') : formatPercent(pacePercent / 100) }}</div>
        </div>
      </div>
    </template>
  </van-cell-group>
</template>

<script setup>
import { budgetSeverity } from '~/utils/AnalyticsUtils'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()

// Deliberately fetched once, on mount, ignoring the page's selected range/pull-to-refresh —
// mirrors analytics-budgets-burn-rate.vue's exact rationale: this section always looks at "the
// current financial month so far," never the page's selected range.
onMounted(() => {
  analyticsStore.fetchMonthProjection()
})

const projection = computed(() => analyticsStore.monthProjection)

// "Pace vs. historical average" — how the projected month-end total compares to what a typical
// month costs, reusing budgets' own severity ramp so a bad pace reads with the same urgency a
// budget overrun does. null (no historical months loaded yet) renders app-chart-meter's neutral
// grey branch rather than a false "good" if there's nothing to compare against.
const historicalAverage = computed(() => analyticsStore.historicalMonthlyAverage(months.value))

const pacePercent = computed(() => {
  const avg = historicalAverage.value.avgExpense
  if (!avg || avg <= 0 || !projection.value.isLoaded) return null
  return Math.round((projection.value.projectedTotal / avg) * 100)
})

const paceSeverity = computed(() => budgetSeverity(pacePercent.value))
</script>

<style scoped>
.analytics-behavior-empty {
  color: var(--semi-black);
}

.analytics-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.analytics-kpi-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
