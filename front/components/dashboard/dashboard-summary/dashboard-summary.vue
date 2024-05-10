<template>
  <van-cell-group inset style="overflow: auto">
    <div class="flex-center-vertical gap-2">
      <app-icon :icon="TablerIconConstants.leftArrow" @click="onPreviousMonth" :size="24" class="m-20" />
      <div class="flex-1 flex-center text-size-14 font-weight-600">{{ rangeTitle }}</div>
      <app-icon :icon="TablerIconConstants.rightArrow" @click="onNextMonth" :size="24" class="m-20" />
    </div>

    <van-grid :column-num="3">
      <dashboard-summary-card
        @click="onGoToTransactionsByType(Transaction.types.income.code)"
        :icon="TablerIconConstants.dashboardTotalIncomes"
        title="Income"
        :subtitle="totalIncomeFormatted"
        subtitleClass="text-success"
      />

      <dashboard-summary-card
        @click="onGoToTransactionsByType(Transaction.types.expense.code)"
        :icon="TablerIconConstants.dashboardTotalExpenses"
        title="Expense"
        :subtitle="totalExpenseFormatted"
        subtitleClass="text-danger"
      />

      <dashboard-summary-card
        @click="onGoToTransactionsByType(Transaction.types.transfer.code)"
        :icon="TablerIconConstants.dashboardTotalTransfers"
        title="Transfers"
        :subtitle="totalTransferFormatted"
        subtitleClass="text-primary"
      />

      <dashboard-summary-card :icon="TablerIconConstants.dashboardTotalSurplus" title="Surplus" :subtitle="totalSurplusFormatted" subtitleClass="" />

      <dashboard-summary-card :icon="TablerIconConstants.dashboardTransactionsCount" title="Transactions" :subtitle="dataStore.totalTransactionsCount" subtitleClass="" />

      <dashboard-summary-card :icon="TablerIconConstants.account" title="Days remaining" :subtitle="remainingDays" />
    </van-grid>
  </van-cell-group>
</template>
<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { addMonths, differenceInDays, startOfDay, subDays, subMonths } from 'date-fns'
import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'
import Account from '~/models/Account.js'

const appStore = useAppStore()
const dataStore = useDataStore()

const startDate = computed(() => {
  let dateCurrentMonth = startOfDay(new Date()).setDate(appStore.dashboard.firstDayOfMonth)
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

// const getFormattedValue = (value) => {
//   if (!appStore.dashboard.showAccountAmounts) {
//     return  '******'
//   }
//   return new Intl.NumberFormat('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value)
// }

const totalExpenseFormatted = computed(() => getFormattedValue(dataStore.totalExpenseThisMonth))
const totalIncomeFormatted = computed(() => getFormattedValue(dataStore.totalIncomeThisMonth))
const totalTransferFormatted = computed(() => getFormattedValue(dataStore.totalTransfersThisMonth))
const totalSurplusFormatted = computed(() => getFormattedValue(dataStore.totalSurplusThisMonth))

const onGoToTransactionsByType = async (type) => {
  const startDate = DateUtils.dateToString(dataStore.dashboardDateStart)
  const endDate = DateUtils.dateToString(dataStore.dashboardDateEnd)
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?type=${type}&date_start=${startDate}&date_end=${endDate}`)
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
</script>
