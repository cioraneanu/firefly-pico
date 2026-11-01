<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('dashboard.transactions_summary.title') }}:</div>

    <van-grid :column-num="3">
      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalIncomes"
        :title="$t('transaction.type.income')"
        :subtitle="totalIncomeFormatted"
        subtitle-class="text-[#28a745]"
        @click="onGoToTransactionsByType(Transaction.types.income)"
      />

      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalExpenses"
        :title="$t('transaction.type.expense')"
        :subtitle="totalExpenseFormatted"
        subtitle-class="text-[#dc3545]"
        @click="onGoToTransactionsByType(Transaction.types.expense)"
      />

      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalTransfers"
        :title="$t('transaction.type.transfer')"
        :subtitle="totalTransferFormatted"
        subtitle-class="text-[#007bff]"
        @click="onGoToTransactionsByType(Transaction.types.transfer)"
      />

      <dashboard-summary-card :icon="TablerIconConstants.dashboardTotalSurplus" :title="$t('dashboard.transactions_summary.surplus')" :subtitle="totalSurplusFormatted" subtitle-class="" />
      <dashboard-summary-card :icon="TablerIconConstants.dashboardTransactionsCount" :title="$t('toolbar.transactions')" :subtitle="dashboardStore.totalTransactionsCount" subtitle-class="" />
      <dashboard-summary-card :icon="TablerIconConstants.account" :title="$t('dashboard.transactions_summary.days_remaining')" :subtitle="remainingDays" />
    </van-grid>

    <div class="van-cell-group-title">{{ $t('dashboard.transactions_summary.savings_summary') }}:</div>
    <van-grid :column-num="3" @click="onNavigateToTransactionSavings">
      <dashboard-summary-card :icon="TablerIconConstants.dashboardTransactionsCount" :title="$t('toolbar.transactions')" :subtitle="dashboardStore.transactionsListSavingsCount" subtitle-class="" />
      <dashboard-summary-card :icon="TablerIconConstants.dashboardCoin" :title="$t('amount')" :subtitle="transactionsListSavingsAmount" :subtitle-class="savingsAmountClass" />
      <dashboard-summary-card :icon="TablerIconConstants.dashboardSavingsPercent" :title="$t('percentage')" :subtitle="savingsPercentFormatted" subtitle-class="text-[#007bff]" />
    </van-grid>
  </van-cell-group>
</template>
<script setup>
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { addMonths } from 'date-fns'
import Transaction from '~/core/models/Transaction.js'

import { useDashboardStore } from '~/core/stores/dashboardStore'

const dashboardStore = useDashboardStore()

const { rangeTitle, remainingDays, totalExpenseFormatted, totalIncomeFormatted, totalTransferFormatted, totalSurplusFormatted, transactionsListSavingsAmount, savingsPercentFormatted } =
  useDashboardSummary()

const links = useDashboardLinks()
const onGoToTransactionsByType = (transactionType) => navigateTo(links.byType(transactionType))

const onNextMonth = () => {
  dashboardStore.month = addMonths(dashboardStore.month, 1)
}
const onPreviousMonth = () => {
  dashboardStore.month = addMonths(dashboardStore.month, -1)
}

watch(
  () => dashboardStore.month,
  (newValue) => {
    dashboardStore.fetchTransactionsForInterval()
  },
)

const savingsAmountClass = computed(() => (dashboardStore.transactionsListSavingsAmount > 0 ? 'text-[#28a745]' : 'text-[#dc3545]'))

const onNavigateToTransactionSavings = () => dashboardStore.transactionsListSavings.length > 0 && navigateTo(links.savings())
</script>
