<template>
  <d-page :title="$t('recurring_transactions')" :description="$t('desktop.recurring_description')">
    <template #actions>
      <d-refresh-button :action="recurringTransactionStore.fetchRecurringTransactions" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_RECURRING_TRANSACTION_ID">{{ $t('recurring_transaction_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <section v-if="filtered.length" class="overflow-x-auto rounded-xl bg-card ring-1 ring-fg/10">
      <table class="d-table min-w-225">
        <thead>
          <tr>
            <th>{{ $t('name') }}</th>
            <th>{{ $t('recurring_transaction_page.repetition_type') }}</th>
            <th>{{ $t('recurring_transaction_page.next_date') }}</th>
            <th>{{ $t('accounts') }}</th>
            <th class="text-right">{{ $t('amount') }}</th>
            <th class="w-11" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="recurring in filtered"
            :key="recurring.id"
            :class="['h-[52px] cursor-pointer', recurring.id === id && 'bg-soft/50']"
            @click="navigateTo(`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${recurring.id}`)"
          >
            <td>
              <span class="flex min-w-0 items-center gap-2.5">
                <span class="relative w-max shrink-0">
                  <d-tile :icon="RecurringTransaction.getIcon(recurring) ?? IconCalendarRepeat" />
                  <span :class="['absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card', dots[RecurringTransaction.getType(recurring)?.code]]" />
                </span>
                <span :class="['flex min-w-0 flex-col', !RecurringTransaction.isActive(recurring) && 'text-dim']">
                  <span class="truncate font-medium">{{ RecurringTransaction.getDisplayName(recurring) }}</span>
                  <span class="truncate text-xs text-dim">{{ $t(RecurringTransaction.getType(recurring)?.t ?? '') }}</span>
                </span>
                <d-badge v-if="!RecurringTransaction.isActive(recurring)">{{ $t('recurring_transaction_page.inactive') }}</d-badge>
              </span>
            </td>
            <td>
              <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                <icon-repeat :size="14" class="text-dim" />
                {{ RecurringTransaction.getRepetitionType(recurring)?.name }}
              </span>
            </td>
            <td class="whitespace-nowrap tabular-nums">{{ next(recurring) }}</td>
            <td>
              <span class="flex min-w-0 items-center gap-1.5">
                <span class="truncate text-dim">{{ Account.getDisplayName(get(recurring, 'attributes.accountSource')) }}</span>
                <icon-arrow-right :size="13" class="shrink-0 text-dim" />
                <span class="truncate">{{ Account.getDisplayName(get(recurring, 'attributes.accountDestination')) }}</span>
              </span>
            </td>
            <td class="text-right">
              <d-amount :value="RecurringTransaction.getAmountFormatted(recurring)" :currency="RecurringTransaction.getCurrencySymbol(recurring)" :type="RecurringTransaction.getType(recurring)" />
            </td>
            <td class="text-dim"><icon-chevron-right :size="16" /></td>
          </tr>
        </tbody>
      </table>
    </section>
    <d-list v-else>
      <d-empty :icon="IconCalendarRepeat" :title="$t('recurring_transaction_page.no_upcoming')" />
    </d-list>

    <d-recurring-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconArrowRight, IconCalendarRepeat, IconChevronRight, IconPlus, IconRepeat } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import RecurringTransaction from '~/core/models/RecurringTransaction'

const recurringTransactionStore = useRecurringTransactionStore()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_RECURRING_TRANSACTION_LIST)
const { search, filtered } = useSearch(
  () => recurringTransactionStore.recurringTransactionList,
  (item) => RecurringTransaction.getDisplayName(item),
)

const dots = { expense: 'bg-tx-expense', income: 'bg-tx-income', transfer: 'bg-tx-transfer' }
const next = (recurring) => {
  const date = RecurringTransaction.getNextOccurrence(recurring)
  return date ? DateUtils.dateToUI(date) : '—'
}
</script>
