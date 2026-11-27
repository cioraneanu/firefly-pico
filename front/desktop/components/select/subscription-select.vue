<template>
  <d-select
    v-model="model"
    :options="subscriptionStore.subscriptionList.filter((subscription) => Subscription.isActive(subscription))"
    :get-label="(item) => Subscription.getDisplayName(item)"
    :get-icon="(item) => Subscription.getIcon(item) ?? IconReceiptRefund"
    :icon="IconReceiptRefund"
    :placeholder="$t('subscription_select')"
    clearable
  />
</template>

<script setup>
import { IconReceiptRefund } from '@tabler/icons-vue'
import Subscription from '~/core/models/Subscription'

const model = defineModel()
const subscriptionStore = useSubscriptionStore()
</script>
