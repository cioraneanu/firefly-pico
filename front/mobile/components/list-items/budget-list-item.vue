<template>
  <app-list-item :row-class="{ 'mx-tx': true, 'is-off': !isActive }" @on-edit="emit('onEdit', value)" @on-delete="emit('onDelete', value)">
    <div class="hd">
      <span class="mx-lead"><app-icon :icon="icon ?? TablerIconConstants.budget" :size="18" :stroke="2" /></span>
      <div class="m" style="gap: 6px">
        <span class="mx-row__hd">
          <span class="mx-row__t">{{ displayName }}</span>
          <span class="mx-amt mx-money" style="font-size: 13.5px">{{ budgetLimitSpent }} / {{ budgetLimitAmount }} {{ budgetCurrencySymbol }}</span>
        </span>
        <span class="mx-prog"><span :class="{ over: budgetLimitPercent >= 100 }" :style="{ width: `${Math.min(budgetLimitPercent, 100)}%` }" /></span>
      </div>
    </div>
    <span class="mx-chips" style="margin-top: 0">
      <span class="mx-chip"
        ><span>{{ budgetType }}</span></span
      >
      <span v-if="budgetAmount" class="mx-chip"
        ><span>{{ budgetPeriod }}</span></span
      >
    </span>
  </app-list-item>
</template>

<script setup>
import { get } from 'lodash-es'
import Budget from '~/core/models/Budget.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const budgetLimit = computed(() => Budget.getLimit(props.value))

const icon = computed(() => Budget.getIcon(props.value))
const displayName = computed(() => get(props.value, 'attributes.name', ' - '))
const isActive = computed(() => !!get(props.value, 'attributes.active'))
const budgetType = computed(() => get(props.value, 'attributes.auto_budget_type.name', ' - '))
const budgetPeriod = computed(() => get(props.value, 'attributes.auto_budget_period.name', ' - '))
const budgetAmount = computed(() => get(props.value, 'attributes.amount', ' - ') || ' - ')
const budgetLimitSpent = computed(() => Math.abs(get(budgetLimit.value, `attributes.spent`, 0)))
const budgetLimitAmount = computed(() => get(budgetLimit.value, 'attributes.amount') ?? 0)
const budgetLimitPercent = computed(() => get(budgetLimit.value, 'attributes.percent') ?? 0)
const budgetCurrencySymbol = computed(() => Budget.getCurrencySymbol(props.value))
</script>
