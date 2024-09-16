<template>
  <van-grid-item>
    <template #icon>
      <budget-icon :value="props.value" />
    </template>
    <template #text>
      <div class="display-flex flex-column align-items-center">
        <div class="font-400 text-size-12 text-center text-muted">{{ displayName }}</div>
        <div class="font-500 text-size-10 text-center">{{ budgetLimitSpent }} / {{ budgetAmount }}</div>
      </div>
    </template>
  </van-grid-item>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Transaction from '~/models/Transaction.js'
import { get } from 'lodash'
import Budget from '~/models/Budget.js'

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


</script>
