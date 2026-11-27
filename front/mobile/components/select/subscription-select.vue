<template>
  <app-select v-model="modelValue" :label="label ?? $t('subscription')" :popup-title="$t('subscription_select')" :list="list" :get-display-value="getDisplayValue" :get-icon-value="getIcon">
    <template #top-right>
      <app-refresh-button :refresh="store.fetchSubscriptions" />
    </template>
  </app-select>
</template>

<script setup>
import { useSubscriptionStore } from '~/core/stores/subscriptionStore'
import Subscription from '~/core/models/Subscription'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

defineProps({
  label: { type: String },
})

const store = useSubscriptionStore()
const modelValue = defineModel()

const list = computed(() => store.subscriptionList.filter((subscription) => Subscription.isActive(subscription)))

const getDisplayValue = (value) => Subscription.getDisplayName(value)
const getIcon = (value) => Subscription.getIcon(value) ?? TablerIconConstants.subscription
</script>
