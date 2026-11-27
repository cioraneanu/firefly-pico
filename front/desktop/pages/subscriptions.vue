<template>
  <d-page :title="$t('subscriptions')" :description="description">
    <template #actions>
      <d-refresh-button :action="subscriptionStore.fetchSubscriptions" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_SUBSCRIPTION_ID">{{ $t('subscription_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="subscription in filtered"
        :key="subscription.id"
        :title="Subscription.getDisplayName(subscription)"
        :icon="Subscription.getIcon(subscription) ?? IconReceiptRefund"
        :to="`${RouteConstants.ROUTE_SUBSCRIPTION_ID}/${subscription.id}`"
        :active="subscription.id === id"
        :class="!Subscription.isActive(subscription) && 'opacity-55'"
      >
        <template #subtitle>
          <d-badge variant="outline" class="text-dim">{{ $t(Subscription.getRepeatFreq(subscription)?.t ?? 'subscription_page.repeat.monthly') }}</d-badge>
          <d-badge v-if="Subscription.getNextExpectedDate(subscription)" variant="outline" class="tabular-nums text-dim"
            ><icon-calendar :size="12" />{{ DateUtils.dateToUI(Subscription.getNextExpectedDate(subscription)) }}</d-badge
          >
        </template>
        <span class="flex shrink-0 items-center gap-3">
          <span class="text-[13px] font-medium tabular-nums">{{ +Subscription.getAverageAmount(subscription).toFixed(2) }} {{ Subscription.getCurrencySymbol(subscription) }}</span>
          <d-badge :variant="stateVariant[getState(subscription)]" class="w-20">{{ $t(`subscription_page.state.${getState(subscription)}`) }}</d-badge>
        </span>
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconReceiptRefund" />
    </d-list>

    <d-subscription-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconCalendar, IconPlus, IconReceiptRefund } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Subscription from '~/core/models/Subscription'
import DateUtils from '~/core/utils/DateUtils'

const { t } = useI18n()
const subscriptionStore = useSubscriptionStore()
// The stored list carries the month it was fetched in: refresh it so the states are this month's
onMounted(() => subscriptionStore.fetchSubscriptions())
const { monthly, yearly, currencySymbol } = useSubscriptionTotals()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_SUBSCRIPTION_LIST)
const { search, filtered } = useSearch(
  () => subscriptionStore.subscriptionList,
  (item) => Subscription.getDisplayName(item),
)

const description = computed(
  () => `${+monthly.value.toFixed(2)} ${currencySymbol.value} ${t('subscription_page.per_month')} · ${+yearly.value.toFixed(2)} ${currencySymbol.value} ${t('subscription_page.per_year')}`,
)
const stateVariant = { paid: 'success', due: 'outline', missed: 'danger', not_due: 'secondary' }
const getState = (subscription) => Subscription.getMonthStatus(subscription, new Date())?.state ?? 'not_due'
</script>
