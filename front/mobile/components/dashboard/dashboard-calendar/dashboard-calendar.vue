<template>
  <app-card :form="false">
    <template #title>
      <h2 class="mx-card__t">{{ monthTitle }}</h2>
    </template>
    <template #actions>
      <span class="mx-badge mx-money"><app-count-up :value="`${totalSurplusFormatted} ${dashboardStore.dashboardCurrencyCode}`" /></span>
    </template>

    <dashboard-calendar-month :start="startDate" :end="endDate" />
  </app-card>
</template>

<script setup>
import { capitalize } from 'lodash-es'
import { format } from 'date-fns'

const dashboardStore = useDashboardStore()
const { totalSurplusFormatted } = useDashboardSummary()

const startDate = computed(() => new Date(dashboardStore.dashboardDateStart))
const endDate = computed(() => new Date(dashboardStore.dashboardDateEnd))
const monthTitle = computed(() => capitalize(format(startDate.value, 'MMMM yyyy')))
</script>
