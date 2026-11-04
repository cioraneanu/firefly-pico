<template>
  <d-card :title="$t('settings.dashboard.cards.recurring_transactions')" flush>
    <div class="-mb-4 -mt-1 divide-y divide-line border-t border-line">
      <nuxt-link
        v-for="row in upcomingRecurring"
        :key="`${row.recurringTransaction.id}-${+row.date}`"
        :to="`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${row.recurringTransaction.id}`"
        class="flex items-center gap-3 px-4 py-2.5 transition-colors last:rounded-b-xl hover:bg-soft/40"
      >
        <d-tile :icon="RecurringTransaction.getIcon(row.recurringTransaction) ?? IconCalendarRepeat" muted />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate font-medium">{{ row.label }}</span>
          <span class="truncate text-[13px] leading-[18px] text-dim">{{ row.timeAgo }} · {{ row.dateFormatted }}</span>
        </span>
        <span :class="['whitespace-nowrap text-right font-medium tabular-nums', colors[row.type?.code]]">{{ row.amount }} {{ row.currencySymbol }}</span>
      </nuxt-link>
      <d-empty v-if="!upcomingRecurring.length" :icon="IconCalendarRepeat" :title="$t('recurring_transaction_page.no_upcoming')" />
    </div>
  </d-card>
</template>

<script setup>
import { IconCalendarRepeat } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import RecurringTransaction from '~/core/models/RecurringTransaction'

const { upcomingRecurring } = useDashboardBars()

const colors = { expense: 'text-danger', income: 'text-income', transfer: 'text-transfer' }
</script>
