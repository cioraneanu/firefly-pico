<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('dashboard.transactions_summary.title') }}:</div>

    <van-grid :column-num="3">
      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalIncomes"
        :title="$t('transaction.type.income')"
        :subtitle="totalIncomeFormatted"
        subtitle-class="text-success"
        @click="onGoToTransactionsByType(Transaction.types.income)"
      />

      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalExpenses"
        :title="$t('transaction.type.expense')"
        :subtitle="totalExpenseFormatted"
        subtitle-class="text-danger"
        @click="onGoToTransactionsByType(Transaction.types.expense)"
      />

      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalTransfers"
        :title="$t('transaction.type.transfer')"
        :subtitle="totalTransferFormatted"
        subtitle-class="text-primary"
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
      <dashboard-summary-card :icon="TablerIconConstants.dashboardSavingsPercent" :title="$t('percentage')" :subtitle="savingsPercentFormatted" subtitle-class="text-primary" />
    </van-grid>
  </van-cell-group>
</template>
<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { addMonths, differenceInDays, startOfDay, subDays, subMonths } from 'date-fns'
import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'

import { useDashboardStore } from '~/stores/dashboardStore'

const profileStore = useProfileStore()
const dashboardStore = useDashboardStore()

const startDate = computed(() => {
  const dateCurrentMonth = startOfDay(new Date()).setDate(profileStore.dashboard.firstDayOfMonth)
  return dateCurrentMonth > new Date() ? subMonths(dateCurrentMonth, 1) : dateCurrentMonth
})

// const endDate = computed(() => startOfDay(new Date()))
const endDate = computed(() => {
  return subDays(addMonths(startDate.value, 1), 1)
})

const rangeTitle = computed(() => {
  const date1 = DateUtils.dateToUI(dashboardStore.dashboardDateStart)
  const date2 = DateUtils.dateToUI(dashboardStore.dashboardDateEnd)
  return `${date1} - ${date2}`
})
const remainingDays = computed(() => {
  return differenceInDays(endDate.value, startOfDay(new Date())) + 1
})

const totalExpenseFormatted = computed(() => formatNumberForDashboard(dashboardStore.totalExpenseThisMonth))
const totalIncomeFormatted = computed(() => formatNumberForDashboard(dashboardStore.totalIncomeThisMonth))
const totalTransferFormatted = computed(() => formatNumberForDashboard(dashboardStore.totalTransfersThisMonth))
const totalSurplusFormatted = computed(() => formatNumberForDashboard(dashboardStore.totalSurplusThisMonth))

const onGoToTransactionsByType = async (transactionType) => {
  const excludedUrl = getExcludedTransactionUrl()
  const filters = [
    TransactionFilterUtils.filters.transactionType.toUrl(transactionType),
    TransactionFilterUtils.filters.dateAfter.toUrl(dashboardStore.dashboardDateStart),
    TransactionFilterUtils.filters.dateBefore.toUrl(dashboardStore.dashboardDateEnd),
  ].join('&')

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${excludedUrl}`)
}

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

const transactionsListSavingsAmount = computed(() => formatNumberForDashboard(dashboardStore.transactionsListSavingsAmount))
const savingsAmountClass = computed(() => (dashboardStore.transactionsListSavingsAmount > 0 ? 'text-success' : 'text-danger'))

const savingsPercentFormatted = computed(() => {
  return `${Math.trunc(dashboardStore.transactionsListSavingsPercentage)} %`
})
const onNavigateToTransactionSavings = async () => {
  if (dashboardStore.transactionsListSavings.length === 0) {
    return
  }
  const transactionIds = dashboardStore.transactionsListSavings.map((item) => item.id).join(',')
  const filters = TransactionFilterUtils.filters.id.toUrl(transactionIds)
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
}
</script>
