<template>
  <section class="mx-card">
    <div class="mx-card__h">
      <div>
        <h2 class="mx-card__t">{{ $t('settings.dashboard.cards.recurring_transactions') }}</h2>
      </div>
    </div>

    <div v-if="hasUpcoming" class="mx-dash-rows">
      <button v-for="row in upcomingList" :key="`${row.recurringTransaction.id}-${row.date}`" type="button" class="mx-row mid" @click="onGoToRecurringTransaction(row.recurringTransaction)">
        <span class="mx-lead sm"><app-icon :icon="getIcon(row)" :size="16" :stroke="2" /></span>
        <span class="mx-row__m">
          <span class="mx-row__t">{{ row.label }}</span>
          <span class="mx-row__s">{{ row.timeAgo }} · {{ row.dateFormatted }}</span>
        </span>
        <span class="mx-amt mx-money" :class="row.amountClass">{{ row.amount }} {{ row.currencySymbol }}</span>
      </button>
    </div>

    <div v-else class="mx-card__c">
      <div class="mx-inline-empty">
        <app-icon :icon="TablerIconConstants.recurringTransaction" :size="16" :stroke="2" />
        <span>{{ $t('recurring_transaction_page.no_upcoming') }}</span>
      </div>
    </div>
  </section>
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import RecurringTransaction from '~/core/models/RecurringTransaction.js'
import Transaction from '~/core/models/Transaction.js'
import { computed } from 'vue'
import { get } from 'lodash-es'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const getIcon = (row) => RecurringTransaction.getIcon(row.recurringTransaction) ?? TablerIconConstants.recurringTransaction

const amountClasses = {
  [Transaction.types.expense.code]: 'e',
  [Transaction.types.income.code]: 'i',
  [Transaction.types.transfer.code]: 't',
}

const { upcomingRecurring } = useDashboardBars()
const upcomingList = computed(() => upcomingRecurring.value.map((row) => ({ ...row, amountClass: amountClasses[get(row.type, 'code')] })))

const hasUpcoming = computed(() => upcomingList.value.length > 0)

const onGoToRecurringTransaction = async (recurringTransaction) => {
  if (recurringTransaction) {
    await navigateTo(`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${recurringTransaction.id}`)
  }
}
</script>
