<template>
  <d-card :title="$t('settings.dashboard.cards.todo_transactions')" flush>
    <template #actions>
      <d-button v-if="tagStore.tagTodo" size="sm" :icon="IconListCheck" :to="links.todo()">
        {{ $t('todo') }}
        <d-badge class="px-1.5 text-dim tabular-nums">{{ dashboardStore.transactionsWithTodo.length }}</d-badge>
      </d-button>
    </template>
    <div class="-mb-4 -mt-1 divide-y divide-line border-t border-line">
      <nuxt-link
        v-for="transaction in dashboardStore.transactionsWithTodo"
        :key="transaction.id"
        :to="`${RouteConstants.ROUTE_TRANSACTION_ID}/${transaction.id}`"
        class="flex items-center gap-3 px-4 py-2.5 transition-colors last:rounded-b-xl hover:bg-soft/40"
      >
        <d-tile :icon="icon(transaction)" muted />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate font-medium">{{ Transaction.getDescription(transaction) }}</span>
          <span class="truncate text-[13px] leading-[18px] text-dim">{{ meta(transaction) }}</span>
        </span>
        <span :class="['whitespace-nowrap text-right font-medium tabular-nums', colors[Transaction.getFirstSplit(transaction)?.type?.code]]"
          >{{ signs[Transaction.getFirstSplit(transaction)?.type?.code] ?? '' }}{{ Transaction.getAmountFormatted(transaction) }} {{ Transaction.getFirstSplit(transaction)?.currency_symbol }}</span
        >
      </nuxt-link>
      <d-empty v-if="!dashboardStore.transactionsWithTodo.length" :icon="IconChecks" :title="tagStore.tagTodo ? $t('desktop.dashboard.nothing_to_do') : $t('desktop.no_todo_tag')" />
    </div>
  </d-card>
</template>

<script setup>
import { IconChecks, IconCoins, IconListCheck } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'

const dashboardStore = useDashboardStore()
const tagStore = useTagStore()
const links = useDashboardLinks()

const colors = { expense: 'text-danger', income: 'text-income', transfer: 'text-transfer' }
const signs = { expense: '−', income: '+' }

const icon = (transaction) => Category.getIcon(Transaction.getCategories(transaction)[0]) ?? Tag.getIcon(Transaction.getTags(transaction).find((tag) => !tag.attributes?.is_todo)) ?? IconCoins
const meta = (transaction) => {
  const split = Transaction.getFirstSplit(transaction)
  return [DateUtils.dateToUI(Transaction.getDate(transaction)), [split?.accountSource, split?.accountDestination].filter(Boolean).map(Account.getDisplayName).join(' → ')].filter(Boolean).join(' · ')
}
</script>
