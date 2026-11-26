<template>
  <app-select
    v-model="selected"
    :label="$t('subscription_page.repeat_freq')"
    :popup-title="$t('subscription_page.repeat_freq')"
    :list="list"
    :get-display-value="(item) => $t(item.t)"
    :has-search="false"
  />
</template>

<script setup>
import Subscription from '~/core/models/Subscription.js'

// The form keeps Firefly's code ("monthly"), the select works with the list items
const modelValue = defineModel()
const list = Subscription.getRepeatFreqList()
const selected = computed({
  get: () => list.find((item) => item.code === modelValue.value) ?? null,
  set: (item) => (modelValue.value = item?.code ?? null),
})
</script>
