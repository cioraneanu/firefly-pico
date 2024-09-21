<template>
  <van-cell-group inset style="overflow: auto">
    <div class="van-cell-group-title">Budgets:</div>

<!--    <div class="flex-center-vertical gap-2">-->
<!--      <div class="flex-1 flex-center text-size-14 font-weight-600">Budgets</div>-->
<!--    </div>-->

    <van-grid v-if="hasBudgets" :column-num="3">
      <dashboard-budget-item v-for="budget in budgetList" :value="budget" />
    </van-grid>

    <div v-else class="text-muted text-size-12 px-3 mb-15" style="margin-top: -10px">
      No budgets ^_^
    </div>
  </van-cell-group>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Transaction from '~/models/Transaction.js'
import DashboardBudgetItem from '~/components/dashboard/dashboard-budgets/dashboard-budget-item.vue'

const dataStore = useDataStore()

const budgetList = dataStore.budgetList
const hasBudgets = computed(() => budgetList.length > 0)
</script>
