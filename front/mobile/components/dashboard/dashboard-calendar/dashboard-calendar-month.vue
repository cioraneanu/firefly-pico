<template>
  <div class="mx-cal">
    <span v-for="dayName in dayNames" :key="dayName" class="dw">{{ dayName }}</span>
    <span v-for="index in padCount" :key="`pad-${index}`" class="pad" />
    <dashboard-calendar-month-day v-for="day in days" :key="+day" :day="day" />
  </div>
</template>

<script setup>
import { capitalize, computed } from 'vue'
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, startOfWeek } from 'date-fns'

const props = defineProps({
  start: {},
  end: {},
})

const dayNames = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(startOfWeek(new Date()), i)
  return capitalize(format(date, 'EEEEEE'))
})

// Empty cells before the first day, so each day lands under its week day
const padCount = computed(() => differenceInCalendarDays(props.start, startOfWeek(props.start)))
const days = computed(() => eachDayOfInterval({ start: props.start, end: props.end }))
</script>
