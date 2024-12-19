<template>
  <td :class="tdClass" :style="dayStyle" :data-date="formattedDate">
    <div class="day-frame">
      <template v-if="dayOfMonth">
        <div class="day-number text-unselectable">{{ dayOfMonth }}</div>
        <div v-if="amountIncome" class="text-success text-size-10">{{ amountIncome }}</div>
        <div v-if="amountExpense" class="text-danger text-size-10">{{ amountExpense }}</div>
        <div v-if="amountTransfer" class="text-primary text-size-10">{{ amountTransfer }}</div>
      </template>
    </div>
  </td>
</template>

<script setup>
import { format, getDate, isAfter, isBefore, isMonday, isSameDay, isSameMonth, isToday, isWeekend, startOfWeek, isFirstDayOfMonth } from 'date-fns'
import { computed } from 'vue'
import Transaction from '~/models/Transaction.js'
import { get } from 'lodash'
import { getFormattedValue } from '~/utils/MathUtils.js'

const props = defineProps({
  day: {},
  month: {},
})
const dataStore = useDataStore()

const isEnabled = computed(() => isSameMonth(props.day, props.month))
const formattedDate = computed(() => (isEnabled ? format(props.day, 'yyyy-MM-dd') : null))
const dayOfMonth = computed(() => (isEnabled.value ? getDate(props.day) : null))

const tdClass = computed(() => {
  return {
    day: true,
    'day-weekend': isWeekend(props.day),
    'day-today': isToday(props.day),
    'day-disabled': isSameMonth(props.day, props.month),

    'day-past': isBefore(props.day, props.month),
    'day-future': isAfter(props.day, props.month),
  }
})

const amountIncome = computed(() => {
  let value = get(dataStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.income.code}`)
  return value ? getFormattedValue(value) : null
})

const amountExpense = computed(() => {
  let value = get(dataStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.expense.code}`)
  return value ? getFormattedValue(value) : null
})

const amountTransfer = computed(() => {
  let value = get(dataStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.transfer.code}`)
  return value ? getFormattedValue(value) : null
})

const dayStyle = computed(() => {
  // In case we ever need to have cells with different heights
  let dayHeight = 50
  return {
    'height': `${dayHeight}px`,
  }
})
</script>
