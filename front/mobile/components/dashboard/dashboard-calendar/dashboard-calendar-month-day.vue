<template>
  <td :class="tdClass" :style="dayStyle" :data-date="formattedDate" @click="onClick">
    <div class="day-frame">
      <template v-if="isVisible">
        <div class="day-number text-unselectable">{{ dayOfMonth }}</div>
        <div v-if="amountIncome" class="text-[#28a745] text-10">{{ amountIncome }}</div>
        <div v-if="amountExpense" class="text-[#dc3545] text-10">{{ amountExpense }}</div>
        <div v-if="amountTransfer" class="text-[#007bff] text-10">{{ amountTransfer }}</div>
      </template>
    </div>
  </td>
</template>

<script setup>
import { format, getDate, isToday, isWeekend } from 'date-fns'
import { computed } from 'vue'
import Transaction from '~/core/models/Transaction.js'
import { get } from 'lodash-es'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'

const props = defineProps({
  day: {},
  isVisible: {
    default: true,
  },
})
const dashboardStore = useDashboardStore()

const formattedDate = computed(() => (props.isVisible ? format(props.day, 'yyyy-MM-dd') : null))
const dayOfMonth = computed(() => (props.isVisible ? getDate(props.day) : null))

const tdClass = computed(() => {
  return {
    'day cursor-pointer': true,
    'day-weekend': isWeekend(props.day),
    'day-today': isToday(props.day),
  }
})

const amountIncome = computed(() => {
  const value = get(dashboardStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.income.code}`)
  return value ? formatNumberForDashboard(value) : null
})

const amountExpense = computed(() => {
  const value = get(dashboardStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.expense.code}`)
  return value ? formatNumberForDashboard(value) : null
})

const amountTransfer = computed(() => {
  const value = get(dashboardStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.transfer.code}`)
  return value ? formatNumberForDashboard(value) : null
})

const isCellEmpty = computed(() => {
  return !amountIncome.value && !amountExpense.value && !amountTransfer.value
})

const dayStyle = computed(() => {
  // In case we ever need to have cells with different heights
  if (isCellEmpty.value) {
    return {
      height: `50px`,
    }
  }
})

const links = useDashboardLinks()
const onClick = () => navigateTo(links.byDay(props.day))
</script>
