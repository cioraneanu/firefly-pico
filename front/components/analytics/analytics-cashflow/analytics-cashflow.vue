<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.cashflow.title') }}:</div>
      <div class="analytics-cashflow-legend text-size-12">
        <span class="analytics-cashflow-legend-dot viz-income-dot" />{{ $t('analytics.cashflow.income') }} <span class="analytics-cashflow-legend-dot viz-expense-dot" />{{
          $t('analytics.cashflow.expense')
        }}
        <span class="analytics-cashflow-legend-dot viz-net-dot" />{{ $t('analytics.cashflow.net') }}
      </div>
    </div>

    <div class="ml-15 mr-15 mb-2">
      <app-chart-bars
        :rows="totals"
        :format-value="formatCompactNumberForDashboard"
        :aria-label="$t('analytics.cashflow.title')"
        :income-label="$t('analytics.cashflow.income')"
        :expense-label="$t('analytics.cashflow.expense')"
        :net-label="$t('analytics.cashflow.net')"
        @month-select="onMonthSelect"
      />
    </div>
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

const totals = computed(() => analyticsStore.monthlyTotals(months.value))

const onMonthSelect = async ({ monthKey }) => {
  const fullMonth = months.value.find((m) => m.key === monthKey)
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

.viz-net-dot {
  background: var(--semi-black);
}
</style>
