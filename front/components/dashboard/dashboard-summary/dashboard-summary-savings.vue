<template>
  <van-cell-group inset @click="onNavigate">
    <div class="van-cell-group-title">Savings summary:</div>

    <van-grid :column-num="3">
      <dashboard-summary-card :icon="TablerIconConstants.dashboardTransactionsCount" title="Transactions" :subtitle="dataStore.transactionsListSavingsCount" subtitleClass="" />

      <dashboard-summary-card :icon="TablerIconConstants.dashboardCoin" title="Amount" :subtitle="transactionsListSavingsAmount" :subtitleClass="savingsAmountClass" />

      <dashboard-summary-card :icon="TablerIconConstants.dashboardSavingsPercent" title="Percentage" :subtitle="savingsPercentFormatted" subtitleClass="text-primary" />
    </van-grid>
  </van-cell-group>
</template>
<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import RouteConstants from '~/constants/RouteConstants.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()

const transactionsListSavingsAmount = computed(() => getFormattedValue(dataStore.transactionsListSavingsAmount))
const savingsAmountClass = computed(() => (dataStore.transactionsListSavingsAmount > 0 ? 'text-success' : 'text-danger'))

const savingsPercentFormatted = computed(() => {
  return `${Math.trunc(dataStore.transactionsListSavingsPercentage)} %`
})
const onNavigate = async () => {
  let transactionIds = dataStore.transactionsListSavings.map(item => item.id).join(',')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?id=${transactionIds}`)
}
</script>
