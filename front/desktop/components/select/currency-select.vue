<template>
  <d-select v-model="model" :options :get-label="(item) => Currency.getDisplayName(item)" :get-icon="() => IconCoin" :icon="IconCoin" :placeholder="$t('currency_select.title')" :clearable />
</template>

<script setup>
import { IconCoin } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import Currency from '~/core/models/Currency'

const model = defineModel()
defineProps({ clearable: Boolean })

const currencyStore = useCurrencyStore()
const options = computed(() => currencyStore.currenciesList.filter((currency) => get(currency, 'attributes.enabled')))
</script>
