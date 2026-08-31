<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.budgets.burn_rate.title') }}:</div>

    <div v-if="!pacing.isEligible" class="text-size-12 analytics-budgets-empty ml-15 mr-15 mb-2">{{ $t('analytics.budgets.burn_rate.not_enough_data') }}</div>

    <div v-else class="ml-15 mr-15 mb-2">
      <div class="analytics-budgets-burn-rate-legend text-size-12">
        <span v-for="line in displaySeries" :key="line.id" class="flex-center-vertical gap-1">
          <span class="analytics-budgets-burn-rate-dot" :style="{ background: `var(${line.colorVar})` }" />{{ line.label }}
        </span>
      </div>
      <app-chart-multiline
        :series="displaySeries"
        :total-days="pacing.totalDays"
        :format-value="formatPercent"
        :aria-label="$t('analytics.budgets.burn_rate.title')"
        :ideal-label="$t('analytics.budgets.burn_rate.ideal')"
        @day-select="onDaySelect"
      />
    </div>

    <app-chart-table-view v-if="pacing.isEligible" :title="$t('analytics.budgets.burn_rate.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('analytics.budgets.burn_rate.budget') }}</th>
            <th>{{ $t('analytics.budgets.burn_rate.pace_today') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in displaySeries" :key="line.id">
            <td>{{ line.label }}</td>
            <td>{{ formatPercent(line.values.at(-1)) }}</td>
          </tr>
        </tbody>
      </table>
    </app-chart-table-view>
  </van-cell-group>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils'
import Budget from '~/models/Budget.js'
import { addDays } from 'date-fns'
import { useAnalyticsStore } from '~/stores/analyticsStore'

const analyticsStore = useAnalyticsStore()
const { t } = useI18n()

// Deliberately fetched once, on mount, not wired into the page's shared range/pull-to-refresh
// watcher (front/pages/analytics.vue) — this is the one section that ignores the page's selected
// range entirely (it always looks at [current financial month start, today]), and its raw-
// transaction fetch is scoped/expensive enough that it should only run when this section is
// actually about to render, matching the "lazy per-section" spirit of the budget accordion above.
onMounted(() => {
  analyticsStore.fetchCurrentPeriodBudgetPacing()
})

const pacing = computed(() => analyticsStore.currentPeriodBudgetPacing)

function resolveLabel(budgetId) {
  if (budgetId === 'other') return t('analytics.budgets.burn_rate.other')
  const budget = analyticsStore.budgetList.find((b) => String(b.id) === String(budgetId))
  return budget ? Budget.getDisplayName(budget) : ''
}

const displaySeries = computed(() => pacing.value.series.map((line) => ({ ...line, label: resolveLabel(line.id) })))

function formatPercent(value) {
  return value == null ? '—' : `${Math.round(value)}%`
}

const onDaySelect = async ({ dayIndex }) => {
  if (!pacing.value.periodStart) return
  const dayEnd = addDays(pacing.value.periodStart, dayIndex)
  const filters = [TransactionFilterUtils.filters.dateAfter.toUrl(pacing.value.periodStart), TransactionFilterUtils.filters.dateBefore.toUrl(dayEnd)].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${getExcludedTransactionUrl()}`)
}
</script>

<style scoped>
.analytics-budgets-empty {
  color: var(--semi-black);
}

.analytics-budgets-burn-rate-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--semi-black);
  margin-bottom: 4px;
}

.analytics-budgets-burn-rate-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
