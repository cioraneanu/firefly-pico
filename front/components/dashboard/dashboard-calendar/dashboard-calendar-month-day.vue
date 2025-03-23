<template>
  <td :class="tdClass" :style="dayStyle" :data-date="formattedDate" @click="onClick">
    <div class="day-frame">
      <template v-if="isVisible">
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
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils.js'
import RouteConstants from '~/constants/RouteConstants.js'

const props = defineProps({
  day: {},
  isVisible: {
    default: true,
  },
})
const dataStore = useDataStore()

const formattedDate = computed(() => (props.isVisible ? format(props.day, 'yyyy-MM-dd') : null))
const dayOfMonth = computed(() => (props.isVisible ? getDate(props.day) : null))

const tdClass = computed(() => {
  return {
    day: true,
    'day-weekend': isWeekend(props.day),
    'day-today': isToday(props.day),
  }
})

const amountIncome = computed(() => {
  let value = get(dataStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.income.code}`)
  return value ? getFormattedValue(value,true) : null
})

const amountExpense = computed(() => {
  let value = get(dataStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.expense.code}`)
  return value ? getFormattedValue(value,true) : null
})

const amountTransfer = computed(() => {
  let value = get(dataStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${Transaction.types.transfer.code}`)
  return value ? getFormattedValue(value,true) : null
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

const onClick = async () => {
  let excludedUrl = getExcludedTransactionUrl()
  let filters = [
    TransactionFilterUtils.filters.dateAfter.toUrl(props.day),
    TransactionFilterUtils.filters.dateBefore.toUrl(props.day),
  ].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${excludedUrl}`)
}
</script>
