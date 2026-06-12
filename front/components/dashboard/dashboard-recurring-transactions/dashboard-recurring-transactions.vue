<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('settings.dashboard.cards.recurring_transactions') }}:</div>
    </div>

    <template v-if="hasUpcoming">
      <div class="display-flex flex-column ml-15 mr-15 mb-10">
        <div
          v-for="row in upcomingList"
          :key="`${row.recurringTransaction.id}-${row.date}`"
          class="flex-center-vertical gap-1 my-1 cursor-pointer"
          @click="onGoToRecurringTransaction(row.recurringTransaction)"
        >
          <app-icon :icon="getIcon(row)" :size="20" />
          <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(row.label, 25) }}</span>
          <div class="tag-gray list-item-subtitle text-size-12">{{ row.dateFormatted }}</div>
          <span class="text-size-12 font-weight-400" :class="row.amountClass" style="min-width: 70px; text-align: right">{{ row.amount }} {{ row.currencySymbol }}</span>
        </div>
      </div>
    </template>
    <div v-else class="text-muted text-size-12 px-3 mb-15" style="margin-top: -10px">{{ $t('recurring_transaction_page.no_upcoming') }}</div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import RecurringTransaction from '~/models/RecurringTransaction.js'
import Transaction from '~/models/Transaction.js'
import DateUtils from '~/utils/DateUtils.js'
import { computed } from 'vue'
import { get } from 'lodash-es'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { useRecurringTransactionStore } from '~/stores/recurringTransactionStore'

const recurringTransactionStore = useRecurringTransactionStore()

const getIcon = (row) => RecurringTransaction.getIcon(row.recurringTransaction) ?? TablerIconConstants.recurringTransaction

const getAmountClass = (recurringTransaction) => {
  switch (get(RecurringTransaction.getType(recurringTransaction), 'code')) {
    case Transaction.types.expense.code:
      return 'text-danger'
    case Transaction.types.income.code:
      return 'text-success'
    case Transaction.types.transfer.code:
      return 'text-primary'
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
          dateFormatted: DateUtils.dateToUI(date),
          amount: formatNumberForDashboard(RecurringTransaction.getAmount(recurringTransaction)),
          currencySymbol: RecurringTransaction.getCurrencySymbol(recurringTransaction),
          amountClass: getAmountClass(recurringTransaction),
        }
      })
    })
  return rows.sort((a, b) => a.date - b.date).slice(0, 10)
})

const hasUpcoming = computed(() => upcomingList.value.length > 0)

const onGoToRecurringTransaction = async (recurringTransaction) => {
  if (recurringTransaction) {
    await navigateTo(`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${recurringTransaction.id}`)
  }
}
</script>
