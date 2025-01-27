<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">Budgets:</div>

    <template v-if="hasBudgets">
      <van-grid :column-num="3">
        <dashboard-summary-card :icon="TablerIconConstants.budgetLimit" title="Budgeted" :subtitle="dataStore.budgetLimitTotal" subtitleClass="text-success" />
        <dashboard-summary-card :icon="TablerIconConstants.budgetLimit" title="Spent" :subtitle="dataStore.budgetLimitSpent" subtitleClass="text-danger" />
        <dashboard-summary-card :icon="TablerIconConstants.budgetLimit" title="Remaining" :subtitle="dataStore.budgetLimitRemaining" subtitleClass="text-primary" />
      </van-grid>

      <div class="bg-primary" style="height: 1px;" />

      <van-grid :column-num="3">
        <dashboard-budget-item v-for="budget in budgetList" :value="budget" />
      </van-grid>
    </template>

    <div v-else class="text-muted text-size-12 px-3 mb-15" style="margin-top: -10px">No budgets ^_^</div>
  </van-cell-group>
</template>

<script setup>
import DashboardBudgetItem from '~/components/dashboard/dashboard-budgets/dashboard-budget-item.vue'
import { get } from 'lodash'
import Transaction from '~/models/Transaction.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const dataStore = useDataStore()

const budgetList = dataStore.budgetList
const hasBudgets = computed(() => budgetList.length > 0)


</script>
