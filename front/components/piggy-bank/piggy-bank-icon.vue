<template>
  <app-circle :progress="piggyBankPercent" :progressColor="progressColor" :size="45" class="piggy-bank-icon">
    <app-icon :icon="icon ?? TablerIconConstants.piggyBank" :size="TablerIconConstants.defaultSize" />
  </app-circle>
</template>

<script setup>
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import PiggyBank from '~/models/PiggyBank.js'
import { head } from 'lodash-es'
import AppCircle from '~/components/ui-kit/app-circle.vue'

const props = defineProps({
  value: {},
})

const icon = computed(() => PiggyBank.getIcon(props.value))
const piggyBankPercent = computed(() => Math.min(PiggyBank.getPercent(props.value), 100))

// The more you save the greener it gets
let colorsList = [
  { start: 0, end: 30, colorWhite: '#E53935', colorDark: '#E53935' },
  { start: 30, end: 60, colorWhite: '#FF5722', colorDark: '#FF5722' },
  { start: 60, end: 90, colorWhite: '#FFC107', colorDark: '#FFC107' },
  { start: 90, end: Infinity, colorWhite: '#4CAF50', colorDark: '#4CAF50' },
]

const profileStore = useProfileStore()
const progressColor = computed(() => {
  let color = colorsList.find((item) => piggyBankPercent.value >= item.start && piggyBankPercent.value < item.end)
  color = color ?? head(colorsList)
  return profileStore.darkTheme ? color.colorDark : color.colorWhite
})
</script>
