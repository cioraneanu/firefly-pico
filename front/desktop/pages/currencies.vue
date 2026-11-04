<template>
  <d-page :title="$t('currencies')" :description="$t('desktop.currencies_description')">
    <template #actions>
      <d-refresh-button :action="currencyStore.fetchCurrencies" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_CURRENCY_ID">{{ $t('currency_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="currency in filtered"
        :key="currency.id"
        :title="Currency.getName(currency)"
        :subtitle="`${Currency.getCode(currency)} · ${Currency.getSymbol(currency)}`"
        :icon="IconCoin"
        :to="`${RouteConstants.ROUTE_CURRENCY_ID}/${currency.id}`"
        :active="currency.id === id"
        :class="!get(currency, 'attributes.enabled') && 'opacity-60'"
      >
        <d-badge v-if="get(currency, 'attributes.default')" variant="success">{{ $t('desktop.default_currency') }}</d-badge>
        <d-badge v-if="!get(currency, 'attributes.enabled')">{{ $t('desktop.disabled') }}</d-badge>
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconCoin" />
    </d-list>

    <d-currency-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconCoin, IconPlus } from '@tabler/icons-vue'
import { get, orderBy } from 'lodash-es'
import RouteConstants from '~/core/constants/RouteConstants'
import Currency from '~/core/models/Currency'

const currencyStore = useCurrencyStore()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_CURRENCY_LIST)
const sorted = computed(() => orderBy(currencyStore.currenciesList, ['attributes.enabled', 'attributes.name'], ['desc', 'asc']))
const { search, filtered } = useSearch(
  sorted,
  (item) => Currency.getName(item),
  (item) => Currency.getCode(item),
  (item) => Currency.getSymbol(item),
)
</script>
