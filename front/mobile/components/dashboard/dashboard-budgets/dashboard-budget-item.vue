<template>
  <van-grid-item class="cursor-pointer" @click="onGoToBudget">
    <template #icon>
      <budget-icon :value="props.value" />
    </template>
    <template #text>
      <div class="flex flex-col items-center">
        <div class="font-semibold text-12 text-center">{{ displayName }}</div>
        <div class="font-medium text-10 text-center">{{ formatNumberForDashboard(budgetLimitSpent) }} / {{ formatNumberForDashboard(budgetLimitAmount) }} {{ budgetCurrencySymbol }}</div>
        <div class="font-medium text-10 text-center" :style="isOverBudget ? 'color: var(--expense2)' : ''">{{ formatNumberForDashboard(budgetLimitRemaining) }} {{ budgetCurrencySymbol }}</div>
        <div class="font-medium text-10 text-center text-muted">{{ budgetLimitInterval }}</div>
      </div>
    </template>
  </van-grid-item>
</template>

<script setup>
import { get } from 'lodash-es'
import Budget from '~/core/models/Budget.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import BudgetLimit from '~/core/models/BudgetLimit.js'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'

const props = defineProps({
  value: {},
})

const budgetLimit = computed(() => Budget.getLimit(props.value))
const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))
const budgetLimitAmount = computed(() => get(budgetLimit.value, 'attributes.amount') ?? 0)
const budgetLimitRemaining = computed(() => get(budgetLimit.value, 'attributes.remaining', 0))
const isOverBudget = computed(() => budgetLimitRemaining.value < 0)
const budgetLimitInterval = computed(() => BudgetLimit.getLimitInterval(budgetLimit.value))
const budgetCurrencySymbol = computed(() => Budget.getCurrencySymbol(props.value))

const onGoToBudget = async () => {
  const budgetId = get(props.value, 'id')
  if (!budgetId) {
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_BUDGET_ID}/${budgetId}`)
}
</script>
