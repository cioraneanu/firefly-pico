<template>
  <van-grid-item @click="onGoToBudget">
    <template #icon>
      <budget-icon :value="props.value" />
    </template>
    <template #text>
      <div class="display-flex flex-column align-items-center">
        <div class="font-600 text-size-12 text-center">{{ displayName }}</div>
        <div class="font-500 text-size-10 text-center ">{{ budgetLimitSpent }} / {{ budgetAmount }}</div>
        <div class="font-500 text-size-10 text-center text-muted">{{ budgetLimitInterval }} </div>
      </div>
    </template>
  </van-grid-item>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Transaction from '~/models/Transaction.js'
import { get } from 'lodash'
import Budget from '~/models/Budget.js'
import RouteConstants from '~/constants/RouteConstants.js'
import BudgetLimit from '~/models/BudgetLimit.js'

const dataStore = useDataStore()

const props = defineProps({
  value: {},
})

const budgetLimit = computed(() => Budget.getLimit(props.value))
const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const budgetType = computed(() => get(props.value, 'attributes.auto_budget_type.name', ' - '))
const budgetPeriod = computed(() => get(props.value, 'attributes.auto_budget_period.name', ' - '))
const budgetAmount = computed(() => get(props.value, 'attributes.amount', ' - '))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0))
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))
const budgetLimitInterval = computed(() => BudgetLimit.getLimitInterval(budgetLimit.value))


const onGoToBudget = async () => {
  let budgetId = get(props.value, 'id')
  if (!budgetId) {
    return
  }

  await navigateTo(`${RouteConstants.ROUTE_BUDGET_ID}/${budgetId}`)
}

</script>
