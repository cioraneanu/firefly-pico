<template>
  <van-cell-group inset >
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

const profileStore = useProfileStore()
const dataStore = useDataStore()

const transactionsListSavingsAmount = computed(() => getFormattedValue(dataStore.transactionsListSavingsAmount))
const savingsAmountClass = computed(() => (dataStore.transactionsListSavingsAmount > 0 ? 'text-success' : 'text-danger'))

const savingsPercentFormatted = computed(() => {
  return `${Math.trunc(dataStore.transactionsListSavingsPercentage)} %`
})
</script>
