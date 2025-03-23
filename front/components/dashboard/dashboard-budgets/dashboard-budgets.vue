<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">Budgets:</div>

    <template v-if="hasBudgets">
      <div class="flex-center-vertical justify-content-center flex-wrap gap-2 m-2">
        <app-chip :title="`Budgeted:`" :subtitle="budgetLimitTotalFormatted" />
        <app-chip :title="`Spent:`" :subtitle="budgetLimitSpentFormatted" />
        <app-chip :title="`Remaining:`" :subtitle="budgetLimitRemainingFormatted" />
      </div>

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
import AppChip from '~/components/ui-kit/app-chip.vue'
import { getFormattedValue } from '~/utils/MathUtils.js'

const dataStore = useDataStore()

const budgetList = dataStore.budgetList
const hasBudgets = computed(() => budgetList.length > 0)

const budgetLimitTotalFormatted = computed(() => `${getFormattedValue(dataStore.budgetLimitTotal,true)} ${dataStore.dashboardCurrencyCode}`)
const budgetLimitSpentFormatted = computed(() => `${getFormattedValue(dataStore.budgetLimitSpent,true)} ${dataStore.dashboardCurrencyCode}`)
const budgetLimitRemainingFormatted = computed(() => `${getFormattedValue(dataStore.budgetLimitRemaining,true) } ${dataStore.dashboardCurrencyCode}`)
</script>
