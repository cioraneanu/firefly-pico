<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('analytics.savings_rate.title') }}:</div>
      <van-popover v-model:show="showDescriptionPopover" placement="bottom-end">
        <div class="text-size-12 p-10" style="max-width: 280px">{{ $t('analytics.savings_rate.description') }}</div>
        <template #reference>
          <button type="button" class="app-button-icon">
            <app-icon :icon="TablerIconConstants.settingsAbout" :size="18" />
          </button>
        </template>
      </van-popover>
    </div>

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
  </van-cell-group>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

// No user-configurable savings target exists in profileStore today — a plain constant, matching
// ANALYTICS_PLAN.md Part 2's "solid target rule at the user's target (default 20%)".
const SAVINGS_RATE_TARGET = 0.2

const analyticsStore = useAnalyticsStore()
const { months } = useAnalyticsRange()

const showDescriptionPopover = ref(false)

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
