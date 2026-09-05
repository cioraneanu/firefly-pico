<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('dashboard.month_projection.title') }}:</div>

    <div v-if="!projection.isLoaded" class="text-size-12 dashboard-month-projection-empty ml-15 mr-15 mb-2">{{ $t('dashboard.month_projection.not_enough_data') }}</div>

    <template v-else>
      <div class="ml-15 mr-15 mb-2">
        <div class="flex-center-vertical gap-2 mb-1">
          <div class="text-size-12 flex-1">{{ $t('dashboard.month_projection.day_progress', { day: projection.daysElapsed, total: projection.daysInMonth }) }}</div>
        </div>
        <app-chart-meter :percent="pacePercent ?? 0" :severity="paceSeverity" />
      </div>

      <div class="dashboard-month-projection-kpi-grid ml-15 mr-15 mb-2">
        <div class="dashboard-month-projection-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('dashboard.month_projection.spent_so_far') }}</div>
          <div class="font-weight-600">{{ formatNumberForDashboard(projection.spentSoFar) }}</div>
        </div>
        <div class="dashboard-month-projection-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('dashboard.month_projection.daily_rate') }}</div>
          <div class="font-weight-600">{{ formatNumberForDashboard(projection.regularDailyRate) }}</div>
          <div class="text-size-12 text-muted">{{ $t('dashboard.month_projection.daily_rate_note') }}</div>
        </div>
        <div class="dashboard-month-projection-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('dashboard.month_projection.projected') }}</div>
          <div class="font-weight-600">{{ formatNumberForDashboard(projection.projectedTotal) }}</div>
        </div>
        <div class="dashboard-month-projection-kpi-tile">
          <div class="text-size-12 text-muted">{{ $t('dashboard.month_projection.vs_historical') }}</div>
          <div class="font-weight-600">{{ pacePercent == null ? $t('dashboard.month_projection.not_enough_data') : formatPercent(pacePercent / 100) }}</div>
        </div>
      </div>
    </template>
  </van-cell-group>
</template>

<script setup>
import { budgetSeverity } from '~/utils/AnalyticsUtils'
import { useDashboardStore } from '~/stores/dashboardStore'

const dashboardStore = useDashboardStore()

// Piggybacks on transactionsList/budgetStore.budgetList, already fetched by fetchDashboard() —
// only the trailing-months comparison needs its own fetch (see dashboardStore.js).
onMounted(() => {
  dashboardStore.fetchHistoricalMonthlyExpenseTotals()
})

const projection = computed(() => dashboardStore.monthProjection)

// "Pace vs. historical average" — how the projected month-end total compares to what a typical
// month costs, reusing budgets' own severity ramp so a bad pace reads with the same urgency a
// budget overrun does. null (no historical months loaded yet) renders app-chart-meter's neutral
// grey branch rather than a false "good" if there's nothing to compare against.
const pacePercent = computed(() => {
  const avg = dashboardStore.historicalMonthlyAverageExpense
  if (!avg || avg <= 0 || !projection.value.isLoaded) return null
  return Math.round((projection.value.projectedTotal / avg) * 100)
})

const paceSeverity = computed(() => budgetSeverity(pacePercent.value))
</script>

<style scoped>
.dashboard-month-projection-empty {
  color: var(--semi-black);
}

.dashboard-month-projection-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.dashboard-month-projection-kpi-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
