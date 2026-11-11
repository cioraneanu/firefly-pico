<template>
  <button type="button" class="d" :class="{ today: isToday(day), fut: isFuture(day) }" :data-date="formattedDate" @click="onClick">
    <span class="n">{{ dayOfMonth }}</span>
    <span v-if="amountIncome" class="tr i mx-money">{{ amountIncome }}</span>
    <span v-if="amountExpense" class="tr mx-money">{{ amountExpense }}</span>
    <span v-if="amountTransfer" class="tr t mx-money">{{ amountTransfer }}</span>
  </button>
</template>

<script setup>
import { format, getDate, isFuture, isToday } from 'date-fns'
import { computed } from 'vue'
import Transaction from '~/core/models/Transaction.js'
import { get } from 'lodash-es'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils.js'

const props = defineProps({
  day: {},
})
const dashboardStore = useDashboardStore()

const formattedDate = computed(() => format(props.day, 'yyyy-MM-dd'))
const dayOfMonth = computed(() => getDate(props.day))

const getAmount = (type) => {
  const value = get(dashboardStore.dashboardCalendarTransactionsByDate, `${formattedDate.value}.${type.code}`)
  return value ? formatNumberForDashboard(value) : null
}

const amountIncome = computed(() => getAmount(Transaction.types.income))
const amountExpense = computed(() => getAmount(Transaction.types.expense))
const amountTransfer = computed(() => getAmount(Transaction.types.transfer))

const links = useDashboardLinks()
const onClick = () => navigateTo(links.byDay(props.day))
</script>
