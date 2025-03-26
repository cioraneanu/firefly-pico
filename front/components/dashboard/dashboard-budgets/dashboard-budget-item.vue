<template>
  <van-grid-item @click="onGoToBudget">
    <template #icon>
      <budget-icon :value="props.value" />
    </template>
    <template #text>
      <div class="display-flex flex-column align-items-center">
        <div class="font-600 text-size-12 text-center">{{ displayName }}</div>
        <div class="font-500 text-size-10 text-center">{{ getFormattedValue(budgetLimitSpent) }} / {{ getFormattedValue(budgetLimitAmount) }} {{ budgetCurrencySymbol }}</div>
        <div class="font-500 text-size-10 text-center text-muted">{{ budgetLimitInterval }}</div>
      </div>
    </template>
  </van-grid-item>
</template>

<script setup>
import { get } from 'lodash'
import Budget from '~/models/Budget.js'
import RouteConstants from '~/constants/RouteConstants.js'
import BudgetLimit from '~/models/BudgetLimit.js'
import { getFormattedValue } from '~/utils/NumberUtils.js'

const dataStore = useDataStore()

const props = defineProps({
  value: {},
})

const budgetLimit = computed(() => Budget.getLimit(props.value))
const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))
const budgetLimitAmount = computed(() => get(budgetLimit.value, 'attributes.amount') ?? 0)
const budgetLimitInterval = computed(() => BudgetLimit.getLimitInterval(budgetLimit.value))
const budgetCurrencySymbol = computed(() => Budget.getCurrencySymbol(props.value))

const onGoToBudget = async () => {
  let budgetId = get(props.value, 'id')
  if (!budgetId) {
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_BUDGET_ID}/${budgetId}`)
}
</script>
