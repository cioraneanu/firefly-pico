<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('analytics.headline.net_cashflow') }}:</div>
    <div class="analytics-hero" :class="summary.totalNet >= 0 ? 'text-viz-income' : 'text-viz-expense'">
      {{ formatNumberForDashboard(summary.totalNet) }}
    </div>

    <div class="analytics-kpi-grid">
      <div v-for="kpi in kpiList" :key="kpi.key" class="analytics-kpi-tile">
        <div class="text-size-12 text-muted">{{ kpi.label }}</div>
        <div class="font-weight-600">{{ kpi.value }}</div>
        <div v-if="kpi.delta !== null" class="text-size-12" :class="kpi.delta >= 0 ? 'text-viz-income' : 'text-viz-expense'">
          {{ kpi.delta >= 0 ? '+' : '' }}{{ formatPercent(kpi.delta) }} {{ $t('analytics.headline.vs_prior_period', { count: months.length }) }}
        </div>
      </div>
    </div>
  </van-cell-group>
</template>

<script setup>
import { useAnalyticsStore } from '~/stores/analyticsStore'
import { useAnalyticsRange } from '~/composables/useAnalyticsRange'

const analyticsStore = useAnalyticsStore()
const { months, priorMonths } = useAnalyticsRange()
const { t } = useI18n()

const summary = computed(() => analyticsStore.rangeSummary(months.value, priorMonths.value))

function relativeDelta(current, prior) {
  if (prior === null || prior === 0 || current === null) return null
  return (current - prior) / Math.abs(prior)
}

const kpiList = computed(() => {
  const s = summary.value
  return [
    { key: 'avgIncome', label: t('analytics.headline.avg_income'), value: formatNumberForDashboard(s.avgIncome), delta: relativeDelta(s.avgIncome, s.prior.avgIncome) },
    { key: 'avgExpense', label: t('analytics.headline.avg_expense'), value: formatNumberForDashboard(s.avgExpense), delta: relativeDelta(s.avgExpense, s.prior.avgExpense) },
    { key: 'avgNet', label: t('analytics.headline.avg_net'), value: formatNumberForDashboard(s.avgNet), delta: relativeDelta(s.avgNet, s.prior.avgNet) },
    { key: 'savingsRate', label: t('analytics.headline.savings_rate'), value: s.savingsRate === null ? t('analytics.headline.not_available') : formatPercent(s.savingsRate), delta: null },
    {
      key: 'largestMonth',
      label: t('analytics.headline.largest_month'),
      value: s.largestMonth ? `${s.largestMonth.key} · ${formatNumberForDashboard(s.largestMonth.expense)}` : t('analytics.headline.not_available'),
      delta: null,
    },
    { key: 'transactionCount', label: t('analytics.headline.transaction_count'), value: s.transactionCount, delta: null },
  ]
})
</script>

<style scoped>
.analytics-hero {
  font-size: 48px;
  font-weight: 600;
  font-variant-numeric: proportional-nums;
  padding: 8px 16px 16px;
}

.analytics-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px 16px;
}

.analytics-kpi-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
