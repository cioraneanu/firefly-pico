<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex items-center">
      <div class="flex-1">{{ $t('settings.dashboard.cards.recurring_transactions') }}:</div>
    </div>

    <template v-if="hasUpcoming">
      <div class="flex flex-col ml-3.75 mr-3.75 mb-2.5">
        <div
          v-for="row in upcomingList"
          :key="`${row.recurringTransaction.id}-${row.date}`"
          class="flex items-center gap-2 my-1 cursor-pointer"
          @click="onGoToRecurringTransaction(row.recurringTransaction)"
        >
          <app-icon :icon="getIcon(row)" :size="24" />

          <div class="flex flex-col flex-1">
            <span class="text-14 font-medium flex-1">{{ ellipsizeText(row.label, 25) }}</span>
            <div class="flex items-center gap-2 text-muted">
              <div class="font-normal text-11">{{ row.timeAgo }}</div>
              <div class="font-normal text-11"></div>
              <div class="font-normal text-11">{{ row.dateFormatted }}</div>
            </div>
          </div>

          <span class="text-13 font-semibold" :class="row.amountClass" style="min-width: 70px; text-align: right">{{ row.amount }} {{ row.currencySymbol }}</span>
        </div>
      </div>
    </template>
    <div v-else class="text-muted text-12 px-4 mb-3.75" style="margin-top: -10px">{{ $t('recurring_transaction_page.no_upcoming') }}</div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import { computed } from 'vue'
import { capitalize, get } from 'lodash-es'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'
import { formatTimeAgo } from '@vueuse/core'

const recurringTransactionStore = useRecurringTransactionStore()

const getIcon = (row) => RecurringTransaction.getIcon(row.recurringTransaction) ?? TablerIconConstants.recurringTransaction

const getAmountClass = (recurringTransaction) => {
  switch (get(RecurringTransaction.getType(recurringTransaction), 'code')) {
    case Transaction.types.expense.code:
      return 'text-[#dc3545]'
    case Transaction.types.income.code:
      return 'text-[#28a745]'
    case Transaction.types.transfer.code:
      return 'text-[#007bff]'
    default:
      return ''
  }
}

const upcomingList = computed(() => {
  const rows = recurringTransactionStore.recurringTransactionList
    .filter((recurringTransaction) => RecurringTransaction.isActive(recurringTransaction))
    .flatMap((recurringTransaction) => {
      return RecurringTransaction.getOccurrences(recurringTransaction).map((date) => {
        return {
          recurringTransaction: recurringTransaction,
          label: RecurringTransaction.getDisplayName(recurringTransaction),
          date: date,
          timeAgo: capitalize(formatTimeAgo(date)),
          dateFormatted: DateUtils.dateToUI(date),
          amount: formatNumberForDashboard(RecurringTransaction.getAmount(recurringTransaction)),
          currencySymbol: RecurringTransaction.getCurrencySymbol(recurringTransaction),
          amountClass: getAmountClass(recurringTransaction),
        }
      })
    })
  return rows.sort((a, b) => a.date - b.date).slice(0, 6)
})

const hasUpcoming = computed(() => upcomingList.value.length > 0)

const onGoToRecurringTransaction = async (recurringTransaction) => {
  if (recurringTransaction) {
    await navigateTo(`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${recurringTransaction.id}`)
  }
}
</script>
