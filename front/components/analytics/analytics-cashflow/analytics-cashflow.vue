<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.cashflow.title') }}:</div>
      <div class="analytics-cashflow-legend text-size-12">
        <span class="analytics-cashflow-legend-dot viz-income-dot" />{{ $t('analytics.cashflow.income') }}
        <span class="analytics-cashflow-legend-dot viz-expense-dot" />{{ $t('analytics.cashflow.expense') }}
      </div>
    </div>

    <div class="analytics-cashflow-bars">
      <div v-for="month in bars" :key="month.key" class="display-flex flex-column align-items-center gap-1 cursor-pointer analytics-cashflow-month" @click="onMonthClick(month)">
        <div class="display-flex gap-1">
          <bar-chart-item-vertical :percent="month.incomePercent" :value="month.incomeValue" label="" class="viz-income-bar" />
          <bar-chart-item-vertical :percent="month.expensePercent" :value="month.expenseValue" label="" class="viz-expense-bar" />
        </div>
        <div class="text-size-12 text-muted">{{ month.shortLabel }}</div>
      </div>
    </div>

    <van-collapse v-model="activeCollapse">
      <van-collapse-item :title="$t('analytics.cashflow.table_view')" name="table">
        <div class="analytics-cashflow-table-wrapper">
          <table class="analytics-cashflow-table">
            <thead>
              <tr>
                <th>{{ $t('calendar') }}</th>
                <th>{{ $t('analytics.cashflow.income') }}</th>
                <th>{{ $t('analytics.cashflow.expense') }}</th>
                <th>{{ $t('analytics.cashflow.net') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="month in totals" :key="month.key">
                <td>{{ month.key }}</td>
                <td>{{ formatNumberForDashboard(month.income) }}</td>
                <td>{{ formatNumberForDashboard(month.expense) }}</td>
                <td>{{ formatNumberForDashboard(month.net) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </van-collapse-item>
    </van-collapse>
  </van-cell-group>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()
const activeCollapse = ref([])

const totals = computed(() => analyticsStore.monthlyTotals(months.value))

// Bar height always reflects the true relative magnitude (the shape/trend is not private —
// it's the exact figure that is), so heights are never flattened when amounts are hidden.
// formatNumberForDashboard() masks only the printed value, matching how every other card
// in the app handles this (see dashboard-week-bars.vue).
const bars = computed(() => {
  const maxAmount = Math.max(...totals.value.map((month) => Math.max(month.income, month.expense)), 1)
  return totals.value.map((month) => ({
    key: month.key,
    shortLabel: month.key.slice(5),
    incomePercent: (month.income / maxAmount) * 100,
    expensePercent: (month.expense / maxAmount) * 100,
    incomeValue: formatCompactNumberForDashboard(month.income),
    expenseValue: formatCompactNumberForDashboard(month.expense),
  }))
})

const onMonthClick = async (month) => {
  const fullMonth = months.value.find((m) => m.key === month.key)
  if (!fullMonth) return
  const filters = [TransactionFilterUtils.filters.dateAfter.toUrl(fullMonth.start), TransactionFilterUtils.filters.dateBefore.toUrl(fullMonth.end)].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${getExcludedTransactionUrl()}`)
}
</script>

<style scoped>
.analytics-cashflow-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--semi-black);
  white-space: nowrap;
}

.analytics-cashflow-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
}

.analytics-cashflow-legend-dot:first-child {
  margin-left: 0;
}

.viz-income-dot {
  background: var(--viz-income);
}

.viz-expense-dot {
  background: var(--viz-expense);
}

.analytics-cashflow-bars {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 4px 8px;
}

.analytics-cashflow-month {
  flex: 0 0 auto;
}

/* Tighter than the shared .bar-container-vertical padding (5px) — with up to 24 months in
   view, every pixel saved per bar pair meaningfully increases how many fit before scrolling.
   :deep() is required — bar-chart-item-vertical.vue is a child component, so its root isn't
   covered by this file's scoped styles by default. */
.analytics-cashflow-month :deep(.bar-container-vertical) {
  padding: 2px;
}

.analytics-cashflow-table-wrapper {
  overflow-x: auto;
}

.analytics-cashflow-table {
  width: 100%;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}

.analytics-cashflow-table th,
.analytics-cashflow-table td {
  padding: 4px 8px;
  text-align: right;
  white-space: nowrap;
}

.analytics-cashflow-table th:first-child,
.analytics-cashflow-table td:first-child {
  text-align: left;
}
</style>
