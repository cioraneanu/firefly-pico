<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.budgets.overview.title') }}:</div>

    <div v-if="budgets.length === 0" class="text-size-12 analytics-budgets-empty ml-15 mr-15 mb-2">{{ $t('analytics.budgets.overview.no_budgets') }}</div>

    <van-collapse v-else v-model="expanded">
      <van-collapse-item v-for="budget in budgets" :key="budget.id" :name="budget.id">
        <template #title>
          <div class="flex-center-vertical gap-2 flex-1">
            <app-icon :icon="budget.icon" :size="20" />
            <div class="text-size-13 font-weight-600 flex-1">{{ budget.label }}</div>
          </div>
        </template>

        <div v-if="budget.status.intervalLabel" class="text-size-12 analytics-budgets-interval ml-15 mr-15">{{ budget.status.intervalLabel }}</div>

        <div v-if="expanded.includes(budget.id)" class="ml-15 mr-15 mb-2">
          <app-chart-bars-target
            :rows="budgetSeries(budget.id)"
            :format-value="formatCompactNumberForDashboard"
            :aria-label="budget.label"
            :actual-label="$t('analytics.budgets.overview.actual')"
            :limit-label="$t('analytics.budgets.overview.limit')"
            @month-select="(payload) => onMonthSelect(budget.id, payload)"
          />
        </div>
      </van-collapse-item>
    </van-collapse>
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

// Which panels are open — drives BOTH the van-collapse visual state and, via the v-if inside each
// panel below, whether that budget's app-chart-bars-target (and its uPlot instance) is mounted at
// all. van-collapse-item renders its content on mount regardless of open state (only visibility is
// CSS-animated), so without this extra v-if every budget would mount its own live canvas instance
// up front — each of which does a full destroy+remount on every dark-mode toggle (Phase 3a's
// documented app-chart-frame.vue cost), multiplied by however many budgets exist.
const expanded = ref([])

// Lazily fetches THIS budget's limits over the page's range the moment its panel opens — the
// chart below reads analyticsStore.budgetLimitsFor(), which is empty (renders bar-only, no limit
// line) until this resolves. Deliberately per-budget, not the old all-budgets/whole-range fetch:
// that one scaled with months x every budget on the page and was the actual source of reported
// timeouts once a panel this size was expanded across a wide range — Firefly computes `spent` for
// every limit record it returns, so narrowing to one budget is a real, not just cosmetic, saving.
watch(expanded, (ids) => {
  for (const id of ids) analyticsStore.fetchBudgetLimitsForBudget(id, range.value.start, range.value.end)
})

// budgetList/currentBudgetLimits are fetched centrally by analytics.vue's own range watcher
// (mirrors how analyticsStore.refresh() is triggered once, not per-section, to avoid every
// section that touches budget data racing its own duplicate fetch).
const budgets = computed(() =>
  analyticsStore.budgetList
    .filter((budget) => Budget.isActive(budget))
    .map((budget) => ({
      id: budget.id,
      label: Budget.getDisplayName(budget),
      icon: Budget.getIcon(budget),
      status: analyticsStore.budgetSeverityStatus(budget.id),
    }))
    // Alphabetical — this accordion no longer surfaces a "current status" ranking (that lives on
    // Home's Budgets card now), so there's no number left to sort by.
    .sort((a, b) => a.label.localeCompare(b.label)),
)

function budgetSeries(budgetId) {
  const limits = analyticsStore.budgetLimitsFor(budgetId, range.value.start, range.value.end)
  return analyticsStore.budgetVsLimitSeries(budgetId, months.value, limits)
}

const onMonthSelect = async (budgetId, { monthKey }) => {
  const month = months.value.find((m) => m.key === monthKey)
  if (!month) return
  const filters = [
    TransactionFilterUtils.filters.dateAfter.toUrl(month.start),
    TransactionFilterUtils.filters.dateBefore.toUrl(month.end),
    TransactionFilterUtils.filters.budget.toUrl({ id: budgetId }),
  ].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${getExcludedTransactionUrl()}`)
}
</script>

<style scoped>
.analytics-budgets-empty {
  color: var(--semi-black);
}

.analytics-budgets-interval {
  color: var(--semi-black);
}
</style>
