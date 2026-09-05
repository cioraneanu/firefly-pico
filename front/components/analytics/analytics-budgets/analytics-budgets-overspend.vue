<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.budgets.overspend.title') }}:</div>

    <div v-if="rows.length === 0" class="text-size-12 analytics-budgets-empty ml-15 mr-15 mb-2">{{ $t('analytics.budgets.overspend.none') }}</div>

    <div v-else class="ml-15 mr-15 mb-2">
      <table class="analytics-budgets-overspend-table">
        <thead>
          <tr>
            <th>{{ $t('analytics.budgets.overspend.budget') }}</th>
            <th>{{ $t('analytics.budgets.overspend.period') }}</th>
            <th>{{ $t('analytics.budgets.overspend.overspend') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="`${row.budgetId}-${row.monthKey}`" class="cursor-pointer" @click="onRowClick(row)">
            <td>{{ row.label }}</td>
            <td>{{ row.intervalLabel }}</td>
            <td>{{ formatNumberForDashboard(row.overspend) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </van-cell-group>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils'
import Budget from '~/models/Budget.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months, range } = useAnalyticsRange()

// This is the one Phase 4a section that genuinely needs every budget's limits over the WHOLE
// range at once (it can't know which (budget, month) pairs overspent without checking all of
// them) — self-fetched here, on mount and on range change, rather than centrally in analytics.vue,
// since it's the expensive shape (Firefly computes `spent` per limit record it returns, so cost
// scales with months x budgets) and no other section needs it anymore.
watch(range, () => analyticsStore.fetchBudgetLimitsForRange(range.value.start, range.value.end), { immediate: true })

function resolveLabel(budgetId) {
  const budget = analyticsStore.budgetList.find((b) => String(b.id) === String(budgetId))
  return budget ? Budget.getDisplayName(budget) : ''
}

const rows = computed(() => analyticsStore.budgetOverspendRows(months.value).map((row) => ({ ...row, label: resolveLabel(row.budgetId) })))

const onRowClick = async (row) => {
  const filters = [
    TransactionFilterUtils.filters.dateAfter.toUrl(row.start),
    TransactionFilterUtils.filters.dateBefore.toUrl(row.end),
    TransactionFilterUtils.filters.budget.toUrl({ id: row.budgetId }),
  ].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${getExcludedTransactionUrl()}`)
}
</script>

<style scoped>
.analytics-budgets-empty {
  color: var(--semi-black);
}

.analytics-budgets-overspend-table {
  width: 100%;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}

.analytics-budgets-overspend-table th,
.analytics-budgets-overspend-table td {
  padding: 4px 8px;
  text-align: right;
  white-space: nowrap;
}

.analytics-budgets-overspend-table th:first-child,
.analytics-budgets-overspend-table td:first-child {
  text-align: left;
}
</style>
