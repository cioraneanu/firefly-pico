<template>
  <d-card :title="$t('settings.dashboard.cards.recurring_transactions')" flush>
    <div class="divide-y divide-line border-t border-line">
      <nuxt-link
        v-for="row in upcomingRecurring"
        :key="`${row.recurringTransaction.id}-${+row.date}`"
        :to="`${RouteConstants.ROUTE_RECURRING_TRANSACTION_ID}/${row.recurringTransaction.id}`"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-soft/50"
      >
        <d-tile :icon="RecurringTransaction.getIcon(row.recurringTransaction) ?? IconCalendarRepeat" size="sm" />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate font-medium">{{ row.label }}</span>
          <span class="text-xs text-dim">{{ row.dateFormatted }} · {{ row.timeAgo }}</span>
        </span>
        <d-amount :value="row.amount" :currency="row.currencySymbol" :type="row.type" />
      </nuxt-link>
    </div>
    <d-empty v-if="!upcomingRecurring.length" :icon="IconCalendarRepeat" :title="$t('recurring_transaction_page.no_upcoming')" />
  </d-card>
</template>

<script setup>
import { IconCalendarRepeat } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import RecurringTransaction from '~/core/models/RecurringTransaction'

const { upcomingRecurring } = useDashboardBars()
</script>
