<template>
  <d-card :title="$t('settings.dashboard.cards.subscriptions')" :description="description" flush>
    <div class="-mb-4 -mt-1 divide-y divide-line border-t border-line">
      <nuxt-link
        v-for="row in rows"
        :key="row.subscription.id"
        :to="transactionsRoute(row.subscription)"
        class="flex items-center gap-3 px-4 py-2.5 transition-colors last:rounded-b-xl hover:bg-soft/40"
      >
        <d-tile :icon="Subscription.getIcon(row.subscription) ?? IconReceiptRefund" muted />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate font-medium">{{ row.label }}</span>
          <span class="truncate text-[13px] leading-[18px] text-dim">{{ getSubtitle(row) }}</span>
        </span>
        <span class="whitespace-nowrap text-right font-medium tabular-nums">{{ row.amount }} {{ currencySymbol }}</span>
        <d-badge :variant="stateVariant[row.state]" class="w-20">{{ $t(`subscription_page.state.${row.state}`) }}</d-badge>
      </nuxt-link>
      <nuxt-link
        v-for="reminder in reminders"
        :key="`${reminder.subscription.id}-${reminder.kind}`"
        :to="`${RouteConstants.ROUTE_SUBSCRIPTION_ID}/${reminder.subscription.id}`"
        class="flex items-center gap-3 px-4 py-2.5 transition-colors last:rounded-b-xl hover:bg-soft/40"
      >
        <d-tile :icon="IconAlarm" muted />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate font-medium">{{ reminder.label }}</span>
          <span class="truncate text-[13px] leading-[18px] text-dim">{{
            $t(reminder.kind === 'end' ? 'dash_page.subscriptions_ends_on' : 'dash_page.subscriptions_cancel_by', { date: reminder.dateFormatted })
          }}</span>
        </span>
      </nuxt-link>
      <d-empty v-if="!rows.length && !reminders.length" :icon="IconReceiptRefund" :title="$t('dash_page.no_subscriptions')" />
    </div>
  </d-card>
</template>

<script setup>
import { IconAlarm, IconReceiptRefund } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Subscription from '~/core/models/Subscription'

const { t } = useI18n()
const { rows, summary, reminders, currencySymbol, transactionsRoute } = useDashboardSubscriptions()

const stateVariant = { paid: 'success', due: 'outline', missed: 'danger' }
const description = computed(() =>
  summary.value.expectedCount
    ? `${t('dash_page.subscriptions_paid_of', { paid: summary.value.paidCount, total: summary.value.expectedCount })} · ${summary.value.paidAmount} / ${summary.value.expectedAmount} ${currencySymbol.value}`
    : '',
)
const getSubtitle = (row) => [row.isOffSchedule ? t('dash_page.subscriptions_off_schedule') : row.dateFormatted, row.expected > 1 && `${row.paid}/${row.expected}`].filter(Boolean).join(' · ')
</script>
