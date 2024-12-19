<template>
  <van-cell-group inset>
    <dashboard-calendar-month
        v-for="(month, index) in monthsList"
        :start="month.start"
        :end="month.end"
        :show-days-name="index === 0"
        :show-month-name="index === 0"
    />
  </van-cell-group>
</template>

<script setup>
import { eachMonthOfInterval, min, max, startOfMonth, endOfMonth } from 'date-fns'

const dataStore = useDataStore()

const monthsList = computed(() => {
  const months = eachMonthOfInterval({
    start: dataStore.dashboardDateStart,
    end: dataStore.dashboardDateEnd,
  })

  return months.map((date) => ({
    month: startOfMonth(date),
    start: max([dataStore.dashboardDateStart, startOfMonth(date)]),
    end: min([dataStore.dashboardDateEnd, endOfMonth(date)]),
  }))
})
</script>
