<template>
  <app-circle :progress="budgetLimitPercent" :progressColor="progressColor" :size="45" class="budget-icon">
    <app-icon :icon="icon ?? TablerIconConstants.budget" :size="TablerIconConstants.defaultSize" />
  </app-circle>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import Budget from '~/models/Budget.js'
import { get, head } from 'lodash'
import AppCircle from '~/components/ui-kit/app-circle.vue'

const props = defineProps({
  value: {},
})

const icon = computed(() => Budget.getIcon(props.value))
const budgetLimit = computed(() => Budget.getLimit(props.value))
const budgetLimitPercent = computed(() => Math.min(get(budgetLimit.value, `attributes.percent`) ?? 0, 100))

let colorsList = [
  // { start: 0, end: Infinity, colorWhite: '#E53935', colorDark: '#E53935' },
  { start: 0, end: 50, colorWhite: '#4CAF50', colorDark: '#4CAF50' },
  { start: 50, end: 70, colorWhite: '#FFC107', colorDark: '#FFC107' },
  { start: 70, end: 90, colorWhite: '#FF5722', colorDark: '#FF5722' },
  { start: 90, end: Infinity, colorWhite: '#E53935', colorDark: '#E53935' },
]

const profileStore = useProfileStore()
const progressColor = computed(() => {
  let color = colorsList.find((item) => budgetLimitPercent.value >= item.start && budgetLimitPercent.value < item.end)
  color = color ?? head(colorsList)
  return profileStore.darkTheme ? color.colorDark : color.colorWhite
})
</script>
