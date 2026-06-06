<template>
  <van-cell-group inset>
    <dashboard-calendar-month :start="startDate" :end="endDate" />
  </van-cell-group>
</template>

<script setup>
const dashboardStore = useDashboardStore()

const startDate = computed(() => new Date(dashboardStore.dashboardDateStart))
const endDate = computed(() => new Date(dashboardStore.dashboardDateEnd))
</script>
