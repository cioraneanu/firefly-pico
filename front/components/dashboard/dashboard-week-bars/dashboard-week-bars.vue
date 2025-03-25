<template>
  <van-cell-group inset>
    <div class="van-cell-group-title">{{ $t('dashboard.expenses_week') }}:</div>
    <div class="display-flex">
      <div class="flex-1" />

      <bar-chart-item-vertical v-for="bar in barsList" v-bind="bar" @click="onClick(bar)" />

      <div class="flex-1" />
    </div>
  </van-cell-group>
</template>
<script setup>
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns'
import { capitalize, get } from 'lodash'
import RouteConstants from '~/constants/RouteConstants.js'
import Transaction from '~/models/Transaction.js'
import { getExcludedTransactionUrl } from '~/utils/DashboardUtils.js'

const dataStore = useDataStore()

const barsList = computed(() => {
  const amountsList = Object.values(dataStore.dashboardExpenseByDay)
  const maxAmount = Math.max(...amountsList)

  const daysList = eachDayOfInterval({
    start: subDays(new Date(), 7),
    end: startOfDay(new Date()),
  })
  return daysList.map((date) => {
    const weekdayName = capitalize(format(date, 'E'))
    const amount = get(dataStore.dashboardExpenseByDay, DateUtils.dateToString(date), 0)
    const percent = (amount / maxAmount) * 100

    return {
      date: date,
      label: weekdayName,
      value: getFormattedValue(amount, 0),
      percent: percent,
    }
  })
})

const onClick = async (bar) => {
  let excludedUrl = getExcludedTransactionUrl()
  let filters = [
    TransactionFilterUtils.filters.dateAfter.toUrl(bar.date),
    TransactionFilterUtils.filters.dateBefore.toUrl(bar.date),
    TransactionFilterUtils.filters.transactionType.toUrl(Transaction.types.expense),
  ].join('&')
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}${excludedUrl}`)
}
</script>
