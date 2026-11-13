<template>
  <app-select
    v-model="modelValue"
    :label="label ?? $t('currency')"
    :popup-title="$t('currency_select.title')"
    :list="list"
    :get-display-value="getDisplayValue"
    :get-icon-value="() => TablerIconConstants.currency"
    :get-meta-value="(value) => Currency.getCode(value)"
  >
    <template #top-right>
      <app-refresh-button :refresh="currencyStore.fetchCurrencies" />
    </template>

    <template v-if="info" #extra>
      <div class="mx-d">{{ info }}</div>
    </template>
  </app-select>
</template>

<script setup>
import { get } from 'lodash-es'
import { useCurrencyStore } from '~/core/stores/currencyStore'
import Currency from '~/core/models/Currency'
import TablerIconConstants from '~/core/constants/TablerIconConstants'

defineProps({
  label: { type: String },
  info: { type: String },
})

const currencyStore = useCurrencyStore()
const modelValue = defineModel()

const list = computed(() => currencyStore.currenciesList.filter((item) => get(item, 'attributes.enabled')))

const getDisplayValue = (value) => Currency.getDisplayName(value)
</script>
