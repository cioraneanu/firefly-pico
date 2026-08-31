<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.savings_rate.title') }}:</div>

    <div v-if="hasNoData" class="text-size-12 analytics-savings-rate-empty ml-15 mr-15 mb-2">{{ $t('analytics.savings_rate.no_data') }}</div>

    <div v-else class="ml-15 mr-15 mb-2">
      <app-chart-line
        :rows="chartRows"
        :target="SAVINGS_RATE_TARGET"
        :format-value="formatPercent"
        :aria-label="$t('analytics.savings_rate.title')"
        :series-label="$t('analytics.savings_rate.series_label')"
        :target-label="$t('analytics.savings_rate.target_label')"
        :redact-when-hidden="false"
        @month-select="onMonthSelect"
      />
    </div>

    <app-chart-table-view :title="$t('analytics.savings_rate.table_view')">
      <table>
        <thead>
          <tr>
            <th>{{ $t('calendar') }}</th>
            <th>{{ $t('analytics.savings_rate.series_label') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <td>{{ row.key }}</td>
            <td>{{ row.rate == null ? $t('analytics.headline.not_available') : formatPercent(row.rate) }}</td>
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
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

// No user-configurable savings target exists in profileStore today — a plain constant, matching
// ANALYTICS_PLAN.md Part 2's "solid target rule at the user's target (default 20%)".
const SAVINGS_RATE_TARGET = 0.2

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()

const rows = computed(() => analyticsStore.savingsRateSeries(months.value))
const hasNoData = computed(() => rows.value.every((row) => row.rate == null))
// app-chart-line.vue's contract is a generic {key, isLoaded, value} — savingsRateSeries() returns
// {key, isLoaded, rate}, so this adapts the field name for the chart only; the table above reads
// row.rate directly since it isn't bound by that generic contract.
const chartRows = computed(() => rows.value.map((row) => ({ key: row.key, isLoaded: row.isLoaded, value: row.rate })))

const onMonthSelect = async ({ monthKey }) => {
  const month = months.value.find((m) => m.key === monthKey)
  if (!month) return
  const filters = [TransactionFilterUtils.filters.dateAfter.toUrl(month.start), TransactionFilterUtils.filters.dateBefore.toUrl(month.end)].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${getExcludedTransactionUrl()}`)
}
</script>

<style scoped>
.analytics-savings-rate-empty {
  color: var(--semi-black);
}
</style>
