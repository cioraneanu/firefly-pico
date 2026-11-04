<template>
  <d-page :title="$t('recurring_transactions')" :description="$t('desktop.recurring_description')">
    <template #actions>
      <d-refresh-button :action="recurringTransactionStore.fetchRecurringTransactions" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_RECURRING_TRANSACTION_ID">{{ $t('recurring_transaction_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="recurring in filtered"
        :key="recurring.id"
        :title="RecurringTransaction.getDisplayName(recurring)"
        :subtitle="subtitle(recurring)"
        :icon="RecurringTransaction.getIcon(recurring) ?? IconCalendarRepeat"
        :to="`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${recurring.id}`"
        :active="recurring.id === id"
        :class="!RecurringTransaction.isActive(recurring) && 'opacity-60'"
      >
        <template v-if="!RecurringTransaction.isActive(recurring)" #title>
          <d-badge>{{ $t('recurring_transaction_page.inactive') }}</d-badge>
        </template>
        <d-amount :value="RecurringTransaction.getAmountFormatted(recurring)" :currency="RecurringTransaction.getCurrencySymbol(recurring)" :type="RecurringTransaction.getType(recurring)" />
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconCalendarRepeat" :title="$t('recurring_transaction_page.no_upcoming')" />
    </d-list>

    <d-recurring-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconCalendarRepeat, IconPlus } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import RecurringTransaction from '~/core/models/RecurringTransaction'

const recurringTransactionStore = useRecurringTransactionStore()
const { t } = useI18n()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST)
const { search, filtered } = useSearch(
  () => recurringTransactionStore.recurringTransactionList,
  (item) => RecurringTransaction.getDisplayName(item),
)

const subtitle = (recurring) => {
  const next = RecurringTransaction.getNextOccurrence(recurring)
  return [RecurringTransaction.getRepetitionType(recurring)?.name, next && `${t('recurring_transaction_page.next_date')}: ${DateUtils.dateToUI(next)}`].filter(Boolean).join(' · ')
}
</script>
