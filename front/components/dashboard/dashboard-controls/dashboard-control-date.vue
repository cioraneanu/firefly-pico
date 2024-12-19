<template>
  <van-cell-group inset class="dashboard-control-date">
    <div class="flex-center-vertical gap-2">
      <app-icon :icon="TablerIconConstants.leftArrow" @click="onPreviousMonth" :size="24" class="m-10" />
      <div class="flex-1 flex-center text-size-14 font-weight-600">{{ rangeTitle }}</div>
      <app-icon :icon="TablerIconConstants.rightArrow" @click="onNextMonth" :size="24" class="m-10" />
    </div>
  </van-cell-group>
</template>

<script setup>
import { addMonths } from 'date-fns'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const dataStore = useDataStore()

const rangeTitle = computed(() => {
  let date1 = DateUtils.dateToUI(dataStore.dashboardDateStart)
  let date2 = DateUtils.dateToUI(dataStore.dashboardDateEnd)
  return `${date1} - ${date2}`
})
const onNextMonth = () => {
  dataStore.dashboard.month = addMonths(dataStore.dashboard.month, 1)
}
const onPreviousMonth = () => {
  dataStore.dashboard.month = addMonths(dataStore.dashboard.month, -1)
}

watch(
  () => dataStore.dashboard.month,
  (newValue) => {
    dataStore.fetchDashboardTransactionsForInterval()
  },
)
</script>
