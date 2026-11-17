<template>
  <button type="button" class="mx-bar" @click="onGoToBudget">
    <span class="nm">
      <app-icon :icon="Budget.getIcon(props.value) ?? TablerIconConstants.budget" :size="15" :stroke="2" />
      <span>{{ displayName }}</span>
    </span>
    <b class="mx-money">{{ formatNumberForDashboard(budgetLimitSpent) }} / {{ formatNumberForDashboard(budgetLimitAmount) }} {{ budgetCurrencySymbol }}</b>
    <span class="trk"><span :class="{ over: isOverBudget }" :style="{ width: `${budgetLimitPercent}%` }" /></span>
    <small>
      <span>{{ budgetLimitInterval }}</span>
      <span class="mx-money" :class="{ e: isOverBudget }">{{ $t('dash_page.amount_left', { amount: `${formatNumberForDashboard(budgetLimitRemaining)} ${budgetCurrencySymbol}` }) }}</span>
    </small>
  </button>
</template>

<script setup>
import { get } from 'lodash-es'
import Budget from '~/core/models/Budget.js'
import RouteConstants from '~/core/constants/RouteConstants.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
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
const budgetLimitPercent = computed(() => Math.min(get(budgetLimit.value, 'attributes.percent') ?? 0, 100))
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
