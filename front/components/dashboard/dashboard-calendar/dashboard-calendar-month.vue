<template>
  <div class="month">
    <div class="month-header flex-1 display-flex-column pb-2">
      <div v-if="showMonthName" class="month-title text-center p-2 font-700">
        <span class="text-primary mr-5">{{ monthName }}</span> {{ yearName }}
      </div>
      <div v-if="showDaysName" class="display-flex font-400 text-size-12">
        <div v-for="dayName in dayNames" class="text-center flex-1">{{ dayName }}</div>
      </div>
    </div>

    <table class="w-100 funky-calendar" style="">
      <tbody>
        <tr v-for="week in calendar">
          <dashboard-calendar-month-day v-for="day in week" :day="day" :month="month" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { capitalize, computed } from 'vue'
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, getDaysInMonth, setDate, startOfMonth, startOfWeek } from 'date-fns'

const props = defineProps({
  start: {},
  end: {},
  showMonthName: {
    default: true,
  },
  showDaysName: {
    default: true,
  },
})

const month = computed(() => startOfMonth(props.start))

const dayNames = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(startOfWeek(new Date()), i)
  return format(date, 'EEEEEE')
})
const monthName = computed(() => capitalize(props.start.toLocaleString('en-EN', { month: 'long' })))
const yearName = computed(() => props.start.getFullYear())

const calendar = computed(() => {
  const start = startOfWeek(props.start)
  const end = endOfWeek(props.end)
  const days = eachDayOfInterval({ start, end })
  return days.reduce((weeks, day, i) => {
    if (i % 7 === 0) weeks.push([])
    weeks[weeks.length - 1].push(day)
    return weeks
  }, [])
})
</script>
