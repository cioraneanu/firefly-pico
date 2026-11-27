<template>
  <section class="mx-card">
    <div class="mx-card__h">
      <div>
        <h2 class="mx-card__t">{{ $t('settings.dashboard.cards.subscriptions') }}</h2>
        <p v-if="summary.expectedCount" class="mx-card__d">
          {{ $t('dash_page.subscriptions_paid_of', { paid: summary.paidCount, total: summary.expectedCount }) }} ·
          <span class="mx-money">{{ summary.paidAmount }} / {{ summary.expectedAmount }} {{ currencySymbol }}</span>
        </p>
      </div>
    </div>

    <div v-if="rows.length || reminders.length" class="mx-dash-rows">
      <button v-for="row in rows" :key="row.subscription.id" type="button" class="mx-row mid" @click="onGoToPayments(row.subscription)">
        <span class="mx-lead sm"><app-icon :icon="Subscription.getIcon(row.subscription) ?? TablerIconConstants.subscription" :size="16" :stroke="2" /></span>
        <span class="mx-row__m">
          <span class="mx-row__t">{{ row.label }}</span>
          <span class="mx-row__s">{{ getSubtitle(row) }}</span>
        </span>
        <span class="mx-row__r">
          <span class="mx-amt mx-money">{{ row.amount }} {{ currencySymbol }}</span>
          <span class="mx-chip" :class="`st-${row.state}`"
            ><span>{{ $t(`subscription_page.state.${row.state}`) }}</span></span
          >
        </span>
      </button>

      <button v-for="reminder in reminders" :key="`${reminder.subscription.id}-${reminder.kind}`" type="button" class="mx-row mid" @click="onGoToSubscription(reminder.subscription)">
        <span class="mx-lead sm"><app-icon :icon="IconAlarm" :size="16" :stroke="2" /></span>
        <span class="mx-row__m">
          <span class="mx-row__t">{{ reminder.label }}</span>
          <span class="mx-row__s">{{ $t(reminder.kind === 'end' ? 'dash_page.subscriptions_ends_on' : 'dash_page.subscriptions_cancel_by', { date: reminder.dateFormatted }) }}</span>
        </span>
      </button>
    </div>

    <div v-else class="mx-card__c">
      <div class="mx-inline-empty">
        <app-icon :icon="TablerIconConstants.subscription" :size="16" :stroke="2" />
        <span>{{ $t('dash_page.no_subscriptions') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { IconAlarm } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import Subscription from '~/core/models/Subscription.js'

const { t } = useI18n()
const { rows, summary, reminders, currencySymbol, transactionsRoute } = useDashboardSubscriptions()

const onGoToPayments = (subscription) => navigateTo(transactionsRoute(subscription))
const onGoToSubscription = (subscription) => navigateTo(`${RouteConstants.ROUTE_SUBSCRIPTION_ID}/${subscription.id}`)
const getSubtitle = (row) => [row.isOffSchedule ? t('dash_page.subscriptions_off_schedule') : row.dateFormatted, row.expected > 1 && `${row.paid}/${row.expected}`].filter(Boolean).join(' · ')
</script>
