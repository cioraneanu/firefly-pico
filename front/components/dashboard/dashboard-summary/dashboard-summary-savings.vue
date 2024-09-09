<template>
  <van-cell-group inset style="overflow: auto">
    <div class="van-cell-group-title">Savings summary:</div>


    <van-grid :column-num="3">
      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalIncomes"
        title="Transactions"
        :subtitle="dataStore.transactionsListSavingsCount"
        subtitleClass="text-success"
      />

      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalExpenses"
        title="Amount"
        :subtitle="transactionsListSavingsAmount"
        subtitleClass="text-danger"
      />

      <dashboard-summary-card
        :icon="TablerIconConstants.dashboardTotalTransfers"
        title="Percentage"
        :subtitle="dataStore.transactionsListSavingsPercentage"
        subtitleClass="text-primary"
      />

    </van-grid>
  </van-cell-group>
</template>
<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const profileStore = useProfileStore()
const dataStore = useDataStore()


const transactionsListSavingsAmount = computed(() => getFormattedValue(dataStore.transactionsListSavingsAmount))
</script>
