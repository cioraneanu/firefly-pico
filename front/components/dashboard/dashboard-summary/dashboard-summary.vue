<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">Transactions summary:</div>

    <van-grid :column-num="3">
      <dashboard-summary-card
        @click="onGoToTransactionsByType(Transaction.types.income)"
        :icon="TablerIconConstants.dashboardTotalIncomes"
        title="Income"
        :subtitle="totalIncomeFormatted"
        subtitleClass="text-success"
      />

      <dashboard-summary-card
        @click="onGoToTransactionsByType(Transaction.types.expense)"
        :icon="TablerIconConstants.dashboardTotalExpenses"
        title="Expense"
        :subtitle="totalExpenseFormatted"
        subtitleClass="text-danger"
      />

      <dashboard-summary-card
        @click="onGoToTransactionsByType(Transaction.types.transfer)"
        :icon="TablerIconConstants.dashboardTotalTransfers"
        title="Transfers"
        :subtitle="totalTransferFormatted"
        subtitleClass="text-primary"
      />

      <dashboard-summary-card :icon="TablerIconConstants.dashboardTotalSurplus" title="Surplus" :subtitle="totalSurplusFormatted" subtitleClass="" />
      <dashboard-summary-card :icon="TablerIconConstants.dashboardTransactionsCount" title="Transactions" :subtitle="dataStore.totalTransactionsCount" subtitleClass="" />
      <dashboard-summary-card :icon="TablerIconConstants.account" title="Days remaining" :subtitle="remainingDays" />
    </van-grid>

    <div class="van-cell-group-title">Savings summary:</div>
    <van-grid :column-num="3" @click="onNavigateToTransactionSavings">
      <dashboard-summary-card :icon="TablerIconConstants.dashboardTransactionsCount" title="Transactions" :subtitle="dataStore.transactionsListSavingsCount" subtitleClass="" />
      <dashboard-summary-card :icon="TablerIconConstants.dashboardCoin" title="Amount" :subtitle="transactionsListSavingsAmount" :subtitleClass="savingsAmountClass" />
      <dashboard-summary-card :icon="TablerIconConstants.dashboardSavingsPercent" title="Percentage" :subtitle="savingsPercentFormatted" subtitleClass="text-primary" />
    </van-grid>
  </van-cell-group>
</template>
<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { addMonths, differenceInDays, startOfDay, subDays, subMonths } from 'date-fns'
import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'
import { getFormattedValue } from '~/utils/MathUtils.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const startDate = computed(() => {
  let dateCurrentMonth = startOfDay(new Date()).setDate(profileStore.dashboard.firstDayOfMonth)
  return dateCurrentMonth > new Date() ? subMonths(dateCurrentMonth, 1) : dateCurrentMonth
})

// const endDate = computed(() => startOfDay(new Date()))
const endDate = computed(() => {
  return subDays(addMonths(startDate.value, 1), 1)
})

const rangeTitle = computed(() => {
  let date1 = DateUtils.dateToUI(dataStore.dashboardDateStart)
  let date2 = DateUtils.dateToUI(dataStore.dashboardDateEnd)
  return `${date1} - ${date2}`
})
const remainingDays = computed(() => {
  return differenceInDays(endDate.value, startOfDay(new Date())) + 1
})

const totalExpenseFormatted = computed(() => getFormattedValue(dataStore.totalExpenseThisMonth,true))
const totalIncomeFormatted = computed(() => getFormattedValue(dataStore.totalIncomeThisMonth,true))
const totalTransferFormatted = computed(() => getFormattedValue(dataStore.totalTransfersThisMonth,true))
const totalSurplusFormatted = computed(() => getFormattedValue(dataStore.totalSurplusThisMonth,true))

const onGoToTransactionsByType = async (transactionType) => {
  let excludedUrl = getExcludedTransactionUrl()
  let filters = [
    TransactionFilterUtils.filters.transactionType.toUrl(transactionType),
    TransactionFilterUtils.filters.dateAfter.toUrl(dataStore.dashboardDateStart),
    TransactionFilterUtils.filters.dateBefore.toUrl(dataStore.dashboardDateEnd),
  ].join('&')

  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${excludedUrl}`)
}

const onNextMonth = () => {
  dataStore.dashboard.month = addMonths(dataStore.dashboard.month, 1)
}
const onPreviousMonth = () => {
  dataStore.dashboard.month = addMonths(dataStore.dashboard.month, -1)
}

watch(
  () => dataStore.dashboard.month,
  (newValue) => {
    dataStore.fetchDashboardTransactionsForInterval()
  },
)

const transactionsListSavingsAmount = computed(() => getFormattedValue(dataStore.transactionsListSavingsAmount))
const savingsAmountClass = computed(() => (dataStore.transactionsListSavingsAmount > 0 ? 'text-success' : 'text-danger'))

const savingsPercentFormatted = computed(() => {
  return `${Math.trunc(dataStore.transactionsListSavingsPercentage)} %`
})
const onNavigateToTransactionSavings = async () => {
  if (dataStore.transactionsListSavings.length === 0) {
    return
  }
  let transactionIds = dataStore.transactionsListSavings.map((item) => item.id).join(',')
  let filters = TransactionFilterUtils.filters.id.toUrl(transactionIds)
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
}
</script>
