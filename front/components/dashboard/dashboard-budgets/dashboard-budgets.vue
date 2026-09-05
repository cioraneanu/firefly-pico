<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('budgets') }}:</div>

    <template v-if="hasBudgets">
      <div class="flex-center-vertical justify-content-center flex-wrap gap-2 m-2">
        <app-chip :title="`${$t('dashboard.budget.budgeted')}:`" :subtitle="budgetLimitTotalFormatted" />
        <app-chip :title="`${$t('dashboard.budget.spent')}:`" :subtitle="budgetLimitSpentFormatted" />
        <app-chip :title="`${$t('dashboard.budget.remaining')}:`" :subtitle="budgetLimitRemainingFormatted" />
      </div>

      <van-grid :column-num="3">
        <dashboard-budget-item v-for="budget in budgetList" :value="budget" />
      </van-grid>

      <div class="van-cell-group-title">{{ $t('dashboard.budget_pace.title') }}:</div>

      <div v-if="!pacing.isEligible" class="text-size-12 dashboard-budget-pace-empty ml-15 mr-15 mb-2">{{ $t('dashboard.budget_pace.not_enough_data') }}</div>

      <div v-else class="ml-15 mr-15 mb-2">
        <div class="dashboard-budget-pace-legend text-size-12">
          <span v-for="line in displaySeries" :key="line.id" class="flex-center-vertical gap-1">
            <span class="dashboard-budget-pace-dot" :style="{ background: `var(${line.colorVar})` }" />{{ line.label }}
          </span>
        </div>
        <app-chart-multiline
          :series="displaySeries"
          :total-days="pacing.totalDays"
          :ideal-total-days="pacing.daysInMonth"
          :format-value="formatPercent"
          :aria-label="$t('dashboard.budget_pace.title')"
          :ideal-label="$t('dashboard.budget_pace.ideal')"
          @day-select="onDaySelect"
        />
      </div>

      <app-chart-table-view v-if="pacing.isEligible" :title="$t('dashboard.budget_pace.table_view')">
        <table>
          <thead>
            <tr>
              <th>{{ $t('dashboard.budget_pace.budget') }}</th>
              <th>{{ $t('dashboard.budget_pace.pace_today') }}</th>
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
    </template>

    <div v-else class="text-muted text-size-12 px-3 mb-15" style="margin-top: -10px">No budgets ^_^</div>
  </van-cell-group>
</template>

<script setup>
import DashboardBudgetItem from '~/components/dashboard/dashboard-budgets/dashboard-budget-item.vue'
import { get } from 'lodash-es'
import Transaction from '~/models/Transaction.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import AppChip from '~/components/ui-kit/app-chip.vue'
import Budget from '~/models/Budget.js'
import RouteConstants from '~/constants/RouteConstants.js'
import TransactionFilterUtils from '~/utils/TransactionFilterUtils.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils'
import { addDays } from 'date-fns'

const budgetStore = useBudgetStore()
const currencyStore = useCurrencyStore()
const dashboardStore = useDashboardStore()
const { t } = useI18n()

const budgetList = budgetStore.budgetList.filter(item => Budget.isActive(item))
const hasBudgets = computed(() => budgetList.length > 0)

const budgetLimitTotalFormatted = computed(() => `${formatNumberForDashboard(dashboardStore.budgetLimitTotal)} ${dashboardStore.dashboardCurrencyCode}`)
const budgetLimitSpentFormatted = computed(() => `${formatNumberForDashboard(dashboardStore.budgetLimitSpent)} ${dashboardStore.dashboardCurrencyCode}`)
const budgetLimitRemainingFormatted = computed(() => `${formatNumberForDashboard(dashboardStore.budgetLimitRemaining) } ${dashboardStore.dashboardCurrencyCode}`)

// ----- Budget pace (cumulative day-by-day spend vs. each budget's limit)

const pacing = computed(() => dashboardStore.budgetPace)

function resolveLabel(budgetId) {
  if (budgetId === 'other') return t('dashboard.budget_pace.other')
  const budget = budgetStore.budgetDictionary[budgetId]
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
.dashboard-budget-pace-empty {
  color: var(--semi-black);
}

.dashboard-budget-pace-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--semi-black);
  margin-bottom: 4px;
}

.dashboard-budget-pace-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
