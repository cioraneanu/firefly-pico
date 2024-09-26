<template>
  <app-circle :progress="budgetLimitPercent" :size="45" class="budget-icon">
    <app-icon :icon="icon ?? TablerIconConstants.budget" :size="TablerIconConstants.defaultSize" />
  </app-circle>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Budget from '~/models/Budget.js'
import { get } from 'lodash'
import AppCircle from '~/components/ui-kit/app-circle.vue'

const props = defineProps({
  value: {},
})

const icon = computed(() => Budget.getIcon(props.value))
const budgetLimit = computed(() => Budget.getLimit(props.value))
const budgetLimitPercent = computed(() => get(budgetLimit.value, `attributes.percent`, 0))
</script>
