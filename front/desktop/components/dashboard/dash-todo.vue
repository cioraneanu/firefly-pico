<template>
  <d-card :title="$t('settings.dashboard.cards.todo_transactions')" flush>
    <template #actions>
      <d-button v-if="tagStore.tagTodo" size="sm" :to="links.todo()">{{ $t('todo') }}: {{ dashboardStore.transactionsWithTodo.length }}</d-button>
    </template>
    <div class="divide-y divide-line border-t border-line">
      <nuxt-link
        v-for="transaction in dashboardStore.transactionsWithTodo"
        :key="transaction.id"
        :to="`${RouteConstants.ROUTE_TRANSACTION_ID}/${transaction.id}`"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-soft/50"
      >
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate font-medium">{{ Transaction.getDescription(transaction) }}</span>
          <span class="text-xs text-dim">{{ DateUtils.dateToUI(Transaction.getDate(transaction)) }}</span>
        </span>
        <d-amount :value="Transaction.getAmountFormatted(transaction)" :currency="Transaction.getFirstSplit(transaction)?.currency_symbol" :type="Transaction.getFirstSplit(transaction)?.type" />
      </nuxt-link>
    </div>
    <d-empty v-if="!dashboardStore.transactionsWithTodo.length" :icon="IconChecklist" :title="tagStore.tagTodo ? null : $t('desktop.no_todo_tag')" />
  </d-card>
</template>

<script setup>
import { IconChecklist } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Transaction from '~/core/models/Transaction'

const dashboardStore = useDashboardStore()
const tagStore = useTagStore()
const links = useDashboardLinks()
</script>
